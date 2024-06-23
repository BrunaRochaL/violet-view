const express = require("express");
const path = require("path");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = 3001; // porta padrão
app.use(express.json());
app.use(cors());

// Configuração do MongoDB
const url = "mongodb://root:1234@localhost:27017";
const dbName = "violetview";
let db;

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);
    console.log("Conectado ao MongoDB");
  })
  .catch((err) => {
    console.error(err);
  });

// Endpoint para login
app.get("/login", async (req, res) => {
  const { email, senha } = req.query;

  console.log(email, senha);

  try {
    // Certifique-se de que os parâmetros foram fornecidos
    if (!email || !senha) {
      return res
        .status(400)
        .json({ mensagem: "Email e senha são obrigatórios." });
    }

    // Certifique-se de que os parâmetros estejam no formato correto
    const user = await db
      .collection("cadastro")
      .findOne({ email: email, senha: senha });

    if (user) {
      res.json({
        autenticado: true,
        userInfo: user,
      });
    } else {
      res.json({ autenticado: false });
    }
  } catch (err) {
    res
      .status(500)
      .json({ mensagem: "Erro interno no servidor", error: err.message });
  }
});

app.get("/filmes", async (req, res) => {
  const { nome } = req.query;

  try {
    let query = {};
    if (nome) {
      query.nome = nome;
    }

    const filmes = await db.collection("filmes").find(query).toArray();
    res.json(filmes);
  } catch (err) {
    res
      .status(500)
      .json({ mensagem: "Erro interno no servidor", error: err.message });
  }
});

// Endpoint para cadastro
app.post("/cadastro", async (req, res) => {
  const { nome, senha, dat_nascimento, email } = req.body;

  if (!nome || !senha || !dat_nascimento || !email) {
    return res.status(400).json({
      mensagem:
        "Nome, senha, data de nascimento e email são campos obrigatórios.",
    });
  }

  try {
    const existingUser = await db.collection("cadastro").findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ mensagem: "Erro: O email já está cadastrado." });
    }

    const currentDate = new Date();
    const idade =
      currentDate.getFullYear() - new Date(dat_nascimento).getFullYear();

    if (idade < 18) {
      return res
        .status(400)
        .json({ mensagem: "Erro: O cliente deve ter no mínimo 18 anos." });
    }

    const newUser = { nome, senha, dat_nascimento, email };
    await db.collection("cadastro").insertOne(newUser);

    res.status(200).json({ mensagem: "Cliente registrado com sucesso." });
  } catch (err) {
    res
      .status(500)
      .json({ mensagem: "Erro interno no servidor", error: err.message });
  }
});

// Endpoint para excluir cadastro por ID
app.delete("/usuario/:id", async (req, res) => {
  const id = req.params.id;
  const { senha } = req.body;

  try {
    const deleteResult = await db
      .collection("cadastro")
      .deleteOne({ _id: new ObjectId(id), senha });

    if (deleteResult.deletedCount > 0) {
      res.status(200).json({ mensagem: "Conta excluída com sucesso." });
    } else {
      res
        .status(401)
        .json({ mensagem: "Senha incorreta ou usuário não encontrado." });
    }
  } catch (err) {
    res
      .status(500)
      .json({ mensagem: "Erro interno no servidor", error: err.message });
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

    const updateResult = await db
      .collection("cadastro")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

    if (updateResult.matchedCount > 0) {
      res.status(204).end();
    } else {
      res.status(200).json({ mensagem: "Nenhum dado foi alterado." });
    }
  } catch (err) {
    res
      .status(500)
      .json({ mensagem: "Erro interno no servidor", error: err.message });
  }
});

app.listen(port, () => {
  console.log("Servidor está rodando na porta " + port);
});
