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

// Rota de login
app.get('/login', async (req, res) => {
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
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// Rota de filmes
app.get('/filmes', async (req, res) => {
  try {
    const { nome } = req.query;
    let query = {};
    if (nome) {
      query = { nome: new RegExp(nome, 'i') };
    }
    const filmes = await req.db.collection('filmes').find(query).toArray();
    res.status(200).json(filmes);
  } catch (error) {
    console.error('Erro ao buscar filmes:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// Rota de cadastro de usuário
app.post('/cadastro', async (req, res) => {
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
    console.error('Erro no cadastro:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// Rota de exclusão de usuário
app.delete('/usuario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { senha } = req.body;

    const user = await req.db.collection('cadastro').findOne({ _id: ObjectId(id), senha });
    if (!user) {
      return res.status(401).json({ mensagem: 'Senha incorreta ou usuário não encontrado.' });
    }

    await req.db.collection('cadastro').deleteOne({ _id: ObjectId(id) });
    res.status(200).json({ mensagem: 'Conta excluída com sucesso.' });
  } catch (error) {
    console.error('Erro na exclusão de usuário:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// Rota de atualização de usuário
app.put('/usuario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verifica se o usuário existe
    const user = await req.db.collection('cadastro').findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    // Procede com a atualização se o usuário existir
    const result = await req.db.collection('cadastro').updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    // Verifica se houve sucesso na atualização
    if (result.modifiedCount === 0) {
      throw new Error('Falha ao atualizar usuário');
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro na atualização de usuário:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não capturado:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;