const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

app.use(cors());
app.use(bodyParser.json());

// Middleware para adicionar o banco de dados ao request
app.use((req, res, next) => {
  req.db = app.locals.db;
  next();
});

const port = 3001; // porta padrão

// Configuração do MongoDB
const url = "mongodb://root:1234@localhost:27017";
const dbName = "violetview";
let db;

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);
    app.locals.db = db;
    console.log("Conectado ao MongoDB");

    // Inicia o servidor apenas após a conexão com o banco de dados
    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
  });

// Middleware para simular erro interno no servidor para fins de teste
app.use((req, res, next) => {
  if (req.headers['x-simulate-error']) {
    return next(new Error('Simulated Error'));
  }
  next();
});

// Rota de login
app.get('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.query;
    const user = await req.db.collection('cadastro').findOne({ email, senha });

    if (user) {
      res.status(200).json({
        autenticado: true,
        userInfo: {
          nome: user.nome,
          email: user.email,
        },
      });
    } else {
      res.status(200).json({ autenticado: false });
    }
  } catch (error) {
    next(error);
  }
});

// Rota de filmes
app.get('/filmes', async (req, res, next) => {
  try {
    const { nome } = req.query;
    let query = {};
    if (nome) {
      query = { nome: new RegExp(nome, 'i') };
    }
    const filmes = await req.db.collection('filmes').find(query).toArray();
    res.status(200).json(filmes);
  } catch (error) {
    next(error);
  }
});

// Rota de cadastro de usuário
app.post('/cadastro', async (req, res, next) => {
  try {
    const { nome, senha, dat_nascimento, email } = req.body;

    if (!nome || !senha || !dat_nascimento || !email) {
      return res.status(400).json({ mensagem: 'Erro: Dados incompletos para cadastro.' });
    }

    const existingUser = await req.db.collection('cadastro').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ mensagem: 'Erro: O email já está cadastrado.' });
    }

    const hoje = new Date();
    const nascimento = new Date(dat_nascimento);
    const idade = hoje.getFullYear() - nascimento.getFullYear();

    if (idade < 18) {
      return res.status(400).json({ mensagem: 'Erro: O cliente deve ter no mínimo 18 anos.' });
    }

    await req.db.collection('cadastro').insertOne({ nome, senha, dat_nascimento, email });
    res.status(200).json({ mensagem: 'Cliente registrado com sucesso.' });
  } catch (error) {
    next(error);
  }
});

// Rota de exclusão de usuário
app.delete('/usuario/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { senha } = req.body;

    const user = await req.db.collection('cadastro').findOne({ _id: ObjectId(id) });

    if (!user) {
      return res.status(401).json({ mensagem: 'Senha incorreta ou usuário não encontrado.' });
    }

    // Verifica se a senha fornecida corresponde à senha armazenada no banco de dados
    if (user.senha !== senha) {
      return res.status(401).json({ mensagem: 'Senha incorreta ou usuário não encontrado.' });
    }

    await req.db.collection('cadastro').deleteOne({ _id: ObjectId(id) });
    res.status(200).json({ mensagem: 'Conta excluída com sucesso.' });
  } catch (error) {
    next(error);
  }
});

// Rota para atualizar usuário
// Rota para atualizar usuário
app.put('/usuario/:id', async (req, res, next) => {
  const userId = req.params.id;
  const { nome, senha, dat_nascimento, email } = req.body;

  try {
    // Verificar se algum dado foi fornecido para atualização
    const updateFields = {};
    if (nome) updateFields.nome = nome;
    if (senha) updateFields.senha = senha;
    if (dat_nascimento) updateFields.dat_nascimento = dat_nascimento;
    if (email) updateFields.email = email;

    if (Object.keys(updateFields).length === 0) {
      return res.status(200).json({ mensagem: 'Nenhum dado foi alterado.' });
    }

    // Atualizar usuário no MongoDB
    const result = await req.db.collection('cadastro').updateOne(
      { _id: ObjectId(userId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    return res.status(204).end(); // 204 significa No Content, sem resposta enviada ao cliente
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ mensagem: 'Erro interno no servidor' });
  }
});


// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não capturado:', err);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

module.exports = app;