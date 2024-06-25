const express = require("express");
const path = require("path");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const fetch = require('node-fetch'); // Importando diretamente para simplificar

const app = express();
const port = 3001; // porta padrão
app.use(express.json());
app.use(cors());

// Middleware para adicionar o banco de dados ao request
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Configuração do MongoDB
const url = "mongodb+srv://matheusfalcao:jogo22@cluster0.xyqiw2v.mongodb.net/";
const dbName = "violetview";
let db;

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);
    console.log("Conectado ao MongoDB");

    // Inicia o servidor somente após a conexão com o MongoDB
    app.listen(port, () => {
      console.log("Servidor está rodando na porta " + port);
    });
  })
  .catch((err) => {
    console.error("Erro ao conectar ao MongoDB:", err);
  });

// Endpoint para login
app.get("/login", async (req, res) => {
  const { email, senha } = req.query;

  try {
    if (!email || !senha) {
      return res.status(400).json({ mensagem: "Email e senha são obrigatórios." });
    }

    const user = await db.collection("cadastro").findOne({ email, senha });
    if (user) {
      await logAction(user._id, "login"); // Registra login
      res.json({ autenticado: true, userInfo: user });
    } else {
      res.json({ autenticado: false });
    }
  } catch (err) {
    console.error("Erro interno no servidor:", err);
    res.status(500).json({ mensagem: "Erro interno no servidor", error: err.message });
  }
});

// Endpoint /filmes
app.get("/filmes", async (req, res) => {
  try {
    const filmes = await db.collection("filmes").find().toArray();
    const { nome } = req.query;

    let filmesFiltrados = filmes;
    if (nome) {
      filmesFiltrados = filmes.filter((filme) => filme.nome === nome);
    }

    res.status(200).json({ filmes: filmesFiltrados });
  } catch (err) {
    console.error("Erro interno no servidor:", err);
    res.status(500).json({ mensagem: "Erro interno no servidor", error: err.message });
  }
});

// Endpoint para cadastro
app.post("/cadastro", async (req, res) => {
  const { nome, senha, dat_nascimento, email } = req.body;

  if (!nome || !senha || !dat_nascimento || !email) {
    return res.status(400).json({
      mensagem: "Nome, senha, data de nascimento e email são campos obrigatórios.",
    });
  }

  try {
    const existingUser = await db.collection("cadastro").findOne({ email });

    if (existingUser) {
      return res.status(400).json({ mensagem: "Erro: O email já está cadastrado." });
    }

    const currentDate = new Date();
    const idade = currentDate.getFullYear() - new Date(dat_nascimento).getFullYear();

    if (idade < 18) {
      return res.status(400).json({ mensagem: "Erro: O cliente deve ter no mínimo 18 anos." });
    }

    const newUser = { nome, senha, dat_nascimento, email };
    await db.collection("cadastro").insertOne(newUser);

    res.status(200).json({ mensagem: "Cliente registrado com sucesso." });
  } catch (err) {
    console.error("Erro interno no servidor:", err);
    res.status(500).json({ mensagem: "Erro interno no servidor", error: err.message });
  }
});

// Endpoint para excluir cadastro por ID
app.delete("/usuario/:id", async (req, res) => {
  const id = req.params.id;
  const { senha } = req.body;

  try {
    const deleteResult = await db.collection("cadastro").deleteOne({ _id: new ObjectId(id), senha });

    if (deleteResult.deletedCount > 0) {
      res.status(200).json({ mensagem: "Conta excluída com sucesso." });
    } else {
      res.status(401).json({ mensagem: "Senha incorreta ou usuário não encontrado." });
    }
  } catch (err) {
    console.error("Erro interno no servidor:", err);
    res.status(500).json({ mensagem: "Erro interno no servidor", error: err.message });
  }
});

// Endpoint para atualizar cadastro por ID
app.put("/usuario/:id", async (req, res) => {
  const id = req.params.id;
  const { nome, senha, dat_nascimento, email } = req.body;

  try {
    const updateFields = {};
    if (nome) updateFields.nome = nome;
    if (senha) updateFields.senha = senha;
    if (dat_nascimento) updateFields.dat_nascimento = dat_nascimento;
    if (email) updateFields.email = email;

    if (Object.keys(updateFields).length === 0) {
      return res.status(200).json({ mensagem: "Nenhum dado foi alterado." });
    }

    const updateResult = await db.collection("cadastro").updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

    if (updateResult.matchedCount > 0) {
      res.status(204).end();
    } else {
      res.status(200).json({ mensagem: "Nenhum dado foi alterado." });
    }
  } catch (err) {
    console.error("Erro interno no servidor:", err);
    res.status(500).json({ mensagem: "Erro interno no servidor", error: err.message });
  }
});

const saveSearchResults = async (query, results) => {
  try {
    await db.collection("search").insertOne({
      query,
      results,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Erro ao salvar os resultados da pesquisa:", err);
  }
};

app.get('/search', async (req, res) => {
  const query = req.query.query;

  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ mensagem: 'Query parameter is required and must be a non-empty string' });
  }

  const omdbApiKey = '2d83b506';
  
  try {
    const response = await fetch(`http://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${omdbApiKey}`);

    if (!response.ok) {
      throw new Error('OMDb API request failed');
    }

    const data = await response.json();

    if (data.Response === 'True') {
      await saveSearchResults(query, data.Search);
      return res.json(data.Search);
    } else {
      await saveSearchResults(query, []);
      return res.status(404).json({ mensagem: 'No movies found' });
    }
  } catch (error) {
    console.error('Internal server error:', error.message);
    return res.status(500).json({ mensagem: 'Internal server error', error: error.message });
  }
});

const logAction = async (userId, action) => {
  try {
    if (!db) {
      return;
    }
    await db.collection("logins").insertOne({
      userId: new ObjectId(userId),
      action,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Erro ao registrar ação:", err);
  }
};

// Endpoint para logout
app.post("/logout", async (req, res) => {
  const { userId } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ mensagem: "userId é obrigatório." });
    }

    await logAction(userId, "logout"); // Registra logout
    res.status(200).json({ mensagem: "Logout registrado com sucesso." });
  } catch (err) {
    console.error("Erro interno no servidor:", err);
    res.status(500).json({ mensagem: "Erro interno no servidor", error: err.message });
  }
});

// Endpoint para buscar registros de login/logout
app.get("/logins", async (req, res) => {
  try {
    const logins = await db.collection("logins")
      .aggregate([
        {
          $lookup: {
            from: "cadastro",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            userId: 1,
            action: 1,
            timestamp: 1,
            userName: "$user.nome",
            userEmail: "$user.email",
          },
        },
      ])
      .toArray();
    res.json(logins);
  } catch (err) {
    console.error("Erro interno no servidor:", err);
    res.status(500).json({ mensagem: "Erro ao buscar registros", error: err.message });
  }
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error("Erro interno no servidor:", err);
  res.status(500).json({ error: "Erro interno no servidor" });
});

module.exports = app,saveSearchResults;