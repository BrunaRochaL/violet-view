const request = require('supertest');
const { MongoClient, ObjectId } = require('mongodb');
const app = require('./app');
const saveSearchResults = require('./app');
const fetchMock = require('jest-fetch-mock');

const mockResponse = (status, data) => {
  return Promise.resolve({
    status,
    json: () => Promise.resolve(data),
  });
};

jest.mock('node-fetch', () => require('jest-fetch-mock'));

const url = "mongodb+srv://matheusfalcao:jogo22@cluster0.xyqiw2v.mongodb.net/";
const dbName = "violetview";

let db;
let connection;

beforeAll(async () => {
  connection = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
  db = connection.db(dbName);
  app.locals.db = db; // inject the db instance into the app's locals
});

afterAll(async () => {
  await connection.close();
});

describe('GET /login', () => {
  beforeEach(async () => {
    // Limpa a coleção 'cadastro' antes de cada teste
    await db.collection('cadastro').deleteMany({});
  });

  it('deve retornar 400 se o email ou senha estiverem faltando', async () => {
    const res = await request(app).get('/login').query({ email: 'test@example.com' });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('mensagem', 'Email e senha são obrigatórios.');
  });

  it('deve retornar 200 e as informações do usuário se as credenciais estiverem corretas', async () => {
    const usersCollection = db.collection('cadastro');
    const testUser = { email: 'test@example.com', senha: '123456', nome: 'Test User' };
    await usersCollection.insertOne(testUser);

    const res = await request(app).get('/login').query({ email: 'test@example.com', senha: '123456' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('autenticado', true);
    expect(res.body).toHaveProperty('userInfo');

    await usersCollection.deleteOne({ email: 'test@example.com' }); // Cleanup
  });

  it('deve retornar 200 e autenticado como falso se as credenciais estiverem incorretas', async () => {
    const res = await request(app).get('/login').query({ email: 'test@example.com', senha: 'wrongpassword' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('autenticado', false);
    expect(res.body).not.toHaveProperty('userInfo');
  });

  it('deve retornar 500 se ocorrer um erro interno no servidor', async () => {
    // Simula um erro interno no servidor ao consultar o banco de dados
    jest.spyOn(db.collection('cadastro'), 'findOne').mockImplementationOnce(() => {
      throw new Error('Erro no banco de dados');
    });

    const res = await request(app).get('/login').query({ email: 'test@example.com', senha: '123456' });
    
    // Verifica se o status code é 500
    expect(res.status).toEqual(500);
    
    // Verifica se a resposta contém as propriedades esperadas
    expect(res.body).toHaveProperty('mensagem', 'Erro interno no servidor');
    expect(res.body).toHaveProperty('error', 'Erro no banco de dados');
  });
});

describe('POST /cadastro', () => {
  beforeEach(async () => {
    // Limpa a coleção 'cadastro' antes de cada teste
    await db.collection('cadastro').deleteMany({});
  });

  it('deve retornar 400 se os campos obrigatórios estiverem faltando', async () => {
    const res = await request(app)
      .post('/cadastro')
      .send({ nome: 'Test', senha: '123456' });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('mensagem', 'Nome, senha, data de nascimento e email são campos obrigatórios.');
  });

  it('deve retornar 400 se o email já existir', async () => {
    const existingUser = {
      nome: 'Existing User',
      senha: '123456',
      dat_nascimento: '1990-01-01',
      email: 'existinguser@example.com'
    };
    await db.collection('cadastro').insertOne(existingUser);

    const res = await request(app)
      .post('/cadastro')
      .send(existingUser);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('mensagem', 'Erro: O email já está cadastrado.');

    // Cleanup
    await db.collection('cadastro').deleteOne({ email: 'existinguser@example.com' });
  });

  it('deve retornar 400 se o cliente tiver menos de 18 anos', async () => {
    const newUser = {
      nome: 'Test User',
      senha: '123456',
      dat_nascimento: '2010-01-01',
      email: 'underage@example.com'
    };

    const res = await request(app)
      .post('/cadastro')
      .send(newUser);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('mensagem', 'Erro: O cliente deve ter no mínimo 18 anos.');
  });

  it('deve retornar 200 e registrar um novo usuário', async () => {
    const newUser = {
      nome: 'Test User',
      senha: '123456',
      dat_nascimento: '1990-01-01',
      email: 'newuser@example.com'
    };

    const res = await request(app)
      .post('/cadastro')
      .send(newUser);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('mensagem', 'Cliente registrado com sucesso.');

    // Cleanup
    await db.collection('cadastro').deleteOne({ email: 'newuser@example.com' });
  });
});

describe('GET /filmes', () => {
  it('deve retornar todos os filmes se nenhum parâmetro de consulta for fornecido', async () => {
    const filmesCollection = db.collection('filmes');
    const testFilmes = [
      { nome: 'Filme 1', diretor: 'Diretor 1' },
      { nome: 'Filme 2', diretor: 'Diretor 2' },
      { nome: 'Filme 3', diretor: 'Diretor 3' }
    ];
    await filmesCollection.insertMany(testFilmes);

    const res = await request(app).get('/filmes');
    expect(res.statusCode).toEqual(200);
    expect(res.body.filmes.length).toBe(testFilmes.length);

    // Cleanup
    await filmesCollection.deleteMany({});
  });

  it('deve retornar filmes filtrados pelo nome se um parâmetro de consulta for fornecido', async () => {
    const filmesCollection = db.collection('filmes');
    const testFilmes = [
      { nome: 'Filme 1', diretor: 'Diretor 1' },
      { nome: 'Filme 2', diretor: 'Diretor 2' },
      { nome: 'Filme 3', diretor: 'Diretor 3' }
    ];
    await filmesCollection.insertMany(testFilmes);

    const res = await request(app).get('/filmes').query({ nome: 'Filme 2' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.filmes.length).toBe(1);
    expect(res.body.filmes[0].nome).toEqual('Filme 2');

    // Cleanup
    await filmesCollection.deleteMany({});
  });
});

describe('DELETE /usuario/:id', () => {
  let userId;

  beforeEach(async () => {
    const usersCollection = db.collection('cadastro');
    const testUser = { nome: 'Test User', senha: '123456', dat_nascimento: '2000-01-01', email: 'test@example.com' };
    const result = await usersCollection.insertOne(testUser);
    userId = result.insertedId;
  });

  afterEach(async () => {
    await db.collection('cadastro').deleteMany({});
  });

  it('deve retornar 401 se a senha estiver incorreta', async () => {
    const res = await request(app)
      .delete(`/usuario/${userId}`)
      .send({ senha: 'wrongpassword' });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('mensagem', 'Senha incorreta ou usuário não encontrado.');
  });

  it('deve retornar 200 e excluir o usuário se a senha estiver correta', async () => {
    const res = await request(app)
      .delete(`/usuario/${userId}`)
      .send({ senha: '123456' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('mensagem', 'Conta excluída com sucesso.');
  });
});

describe('POST /logout', () => {
  let userId;

  beforeEach(async () => {
    const usersCollection = db.collection('cadastro');
    const testUser = { nome: 'Test User', senha: '123456', dat_nascimento: '2000-01-01', email: 'test@example.com' };
    const result = await usersCollection.insertOne(testUser);
    userId = result.insertedId;
  });

  afterEach(async () => {
    await db.collection('cadastro').deleteMany({});
    await db.collection('logins').deleteMany({});
  });

  it('deve retornar 400 se o userId estiver faltando', async () => {
    const res = await request(app).post('/logout').send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('mensagem', 'userId é obrigatório.');
  });

  it('deve retornar 200 e registrar uma ação de logout', async () => {
    await db.collection('logins').insertOne({ userId, action: 'login', timestamp: new Date() });

    const res = await request(app).post('/logout').send({ userId: userId.toString() });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('mensagem', 'Logout registrado com sucesso.');
  });
  describe('Conexão com o MongoDB', () => {
    let originalMongoClientConnect;
    let consoleErrorSpy;
  
    beforeAll(() => {
      // Mock MongoClient.connect to simulate connection failure
      originalMongoClientConnect = MongoClient.connect;
      MongoClient.connect = jest.fn(() => {
        return Promise.reject(new Error('Connection failed'));
      });
  
      // Spy on console.error before each test
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });
  
    afterAll(() => {
      // Restore original MongoClient.connect and console.error after all tests
      MongoClient.connect = originalMongoClientConnect;
      consoleErrorSpy.mockRestore();
    });
  
    it('deve exibir console.error se não conseguir conectar ao MongoDB', async () => {
      try {
        // Attempt to start the app, which triggers MongoDB connection
        await require('./app'); // Replace with the correct path to your app file
      } finally {
        // Expect console.error to have been called once
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Erro ao conectar ao MongoDB:', expect.any(Error));
      }
    });
  });  

  describe('PUT /usuario/:id', () => {
    beforeEach(async () => {
      // Limpa a coleção 'cadastro' antes de cada teste
      await db.collection('cadastro').deleteMany({});
    });
  
    it('deve retornar 200 e a mensagem "Nenhum dado foi alterado." se nenhum dado for fornecido', async () => {
      const userId = new ObjectId(); // Cria um novo ID de usuário
      const res = await request(app)
        .put(`/usuario/${userId}`)
        .send({});
  
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('mensagem', 'Nenhum dado foi alterado.');
    });
  
    it('deve retornar 204 se os dados do usuário forem atualizados com sucesso', async () => {
      const userData = {
        nome: 'Test User',
        senha: '123456',
        dat_nascimento: '2000-01-01',
        email: 'test@example.com'
      };
    
      const user = await db.collection('cadastro').insertOne(userData);
    
      const updatedData = {
        nome: 'Updated User',
        senha: 'updatedPassword',
        dat_nascimento: '1990-01-01',
        email: 'updateduser@example.com'
      };
    
      const res = await request(app)
        .put(`/usuario/${user.insertedId}`)
        .send(updatedData);
    
      expect(res.statusCode).toEqual(204);
    
      // Verifica se os dados foram realmente atualizados no banco de dados
      const updatedUser = await db.collection('cadastro').findOne({ _id: user.insertedId });
      expect(updatedUser.nome).toEqual(updatedData.nome);
      expect(updatedUser.senha).toEqual(updatedData.senha);
      
      // Verifica se dat_nascimento está presente e é uma instância válida de Date
      if (updatedUser.dat_nascimento) {
        expect(new Date(updatedUser.dat_nascimento).toISOString()).toEqual(new Date(updatedData.dat_nascimento).toISOString());
      }
    
      expect(updatedUser.email).toEqual(updatedData.email);
    });
  
    it('deve retornar 200 e a mensagem "Nenhum dado foi alterado." se o ID não existir', async () => {
      const nonExistentId = new ObjectId(); // ID que não existe no banco de dados
      const res = await request(app)
        .put(`/usuario/${nonExistentId}`)
        .send({ nome: 'Updated User' });
  
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('mensagem', 'Nenhum dado foi alterado.');
    });
  
    it('deve retornar 500 se ocorrer um erro interno no servidor', async () => {
      // Forçar um erro interno simulando um erro no banco de dados
      const mockDbError = new Error('Erro no banco de dados');
      jest.spyOn(db.collection('cadastro'), 'updateOne').mockRejectedValue(mockDbError);
  
      const userId = new ObjectId(); // Cria um novo ID de usuário
      const res = await request(app)
        .put(`/usuario/${userId}`)
        .send({ nome: 'Updated User' });
  
      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('mensagem', 'Erro interno no servidor');
      expect(res.body).toHaveProperty('error', 'Erro no banco de dados');
    });
  });

  
  describe('POST /logout › GET /search', () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });
  
    it('deve retornar resultados de pesquisa e salvá-los no banco de dados quando os resultados forem encontrados', async () => {
      const query = 'Batman';
      const results = [
        { title: 'Batman Begins', year: '2005' },
        { title: 'The Dark Knight', year: '2008' }
      ];
  
      fetchMock.mockResponseOnce(JSON.stringify({ Response: 'True', Search: results }));
  
      const response = await request(app)
        .get('/search')
        .query({ query });
  
      expect(response.status).toBe(200);
      expect(response.body).toEqual(results);
  
      // Verifica se os dados foram salvos corretamente no banco de dados
      const savedSearch = await saveSearchResults(query, results);
      expect(savedSearch).toBeTruthy(); // Verifica se a função de salvamento retornou verdadeiro
      expect(savedSearch.query).toEqual(query); // Verifica se a consulta salva é igual à consulta de pesquisa
      expect(savedSearch.results).toEqual(results); // Verifica se os resultados salvos são os mesmos da pesquisa
    });
  
    it('deve retornar 404 e salvar resultados vazios no banco de dados quando nenhum filme for encontrado', async () => {
      const query = 'NonExistentMovie';
  
      fetchMock.mockResponseOnce(JSON.stringify({ Response: 'False', Error: 'Movie not found!' }));
  
      const response = await request(app)
        .get('/search')
        .query({ query });
  
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ mensagem: 'No movies found' });
  
      // Verifica se a tentativa de pesquisa sem resultados foi salva corretamente no banco de dados
      const savedSearch = await saveSearchResults(query, []);
      expect(savedSearch).toBeTruthy(); // Verifica se a função de salvamento retornou verdadeiro
      expect(savedSearch.query).toEqual(query); // Verifica se a consulta salva é igual à consulta de pesquisa
      expect(savedSearch.results).toEqual([]); // Verifica se os resultados salvos são um array vazio
    });
  
    it('deve retornar 500 e salvar a mensagem de erro no banco de dados quando ocorrer um erro interno no servidor', async () => {
      const query = 'InternalError';
  
      fetchMock.mockRejectOnce(new Error('Internal server error'));
  
      const response = await request(app)
        .get('/search')
        .query({ query });
  
      expect(response.status).toBe(500); // Verifica se o status da resposta é 500
      expect(response.body).toEqual({ mensagem: 'Internal server error' });
  
      // Verifica se o erro foi tratado corretamente e se a mensagem de erro foi salva no banco de dados
      const savedSearch = await saveSearchResults(query, []);
      expect(savedSearch).toBeTruthy(); // Verifica se a função de salvamento retornou verdadeiro
      expect(savedSearch.query).toEqual(query); // Verifica se a consulta salva é igual à consulta de pesquisa
      expect(savedSearch.results).toEqual([]); // Verifica se os resultados salvos são um array vazio
    });
  
    it('deve retornar 400 quando o parâmetro de consulta estiver faltando', async () => {
      const response = await request(app)
        .get('/search');
  
      expect(response.status).toBe(400); // Verifica se o status da resposta é 400
      expect(response.body).toEqual({ mensagem: 'Query parameter is required and must be a non-empty string' });
    });
  });
})