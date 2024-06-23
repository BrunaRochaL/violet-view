const { MongoClient} = require('mongodb');
const request = require('supertest');
const app = require('./app');

describe('API Endpoints', () => {
  let connection;
  let db;

  beforeAll(async () => {
    connection = await MongoClient.connect(globalThis.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = await connection.db(globalThis.__MONGO_DB_NAME__);
    app.locals.db = db;
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Testes da rota /login', () => {
    it('Deve retornar status 500 em caso de erro interno no servidor', async () => {
      // Simulando um erro interno no MongoDB ao tentar fazer a consulta
      jest.spyOn(app.locals.db, 'collection').mockImplementationOnce(() => {
        throw new Error('Erro interno no MongoDB');
      });
  
      const response = await request(app)
        .get('/login')
        .query({ email: 'email@teste.com', senha: 'senha123' });
  
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro interno no servidor' });
    });
  
    it('Deve retornar autenticado:true se o usuário existir', async () => {
      // Implemente o mock do findOne para simular o retorno de um usuário existente
      const mockUser = { nome: 'Usuário Teste', email: 'email@teste.com' };
      jest.spyOn(app.locals.db, 'collection').mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockUser),
      });
  
      const response = await request(app)
        .get('/login')
        .query({ email: 'email@teste.com', senha: 'senha123' });
  
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        autenticado: true,
        userInfo: {
          nome: mockUser.nome,
          email: mockUser.email,
        },
      });
    });
  
    it('Deve retornar autenticado:false se o usuário não existir', async () => {
      // Implemente o mock do findOne para simular o retorno de nenhum usuário
      jest.spyOn(app.locals.db, 'collection').mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });
  
      const response = await request(app)
        .get('/login')
        .query({ email: 'email@naoexiste.com', senha: 'senha456' });
  
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ autenticado: false });
    });
  });

  describe('Testes da rota /filmes', () => {
    it('Deve retornar status 500 em caso de erro interno no servidor', async () => {
      // Simulando um erro interno no MongoDB ao tentar fazer a consulta
      jest.spyOn(app.locals.db, 'collection').mockImplementationOnce(() => {
        throw new Error('Erro interno no MongoDB');
      });
  
      const response = await request(app)
        .get('/filmes')
        .query({ nome: 'Matrix' });
  
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro interno no servidor' });
    });
  
    it('Deve retornar a lista de filmes filtrada por nome', async () => {
      // Implemente o mock do método find para simular a busca de filmes
      const mockFilmes = [
        { nome: 'Matrix', ano: 1999 },
        { nome: 'Interestelar', ano: 2014 },
      ];
      jest.spyOn(app.locals.db, 'collection').mockReturnValue({
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockFilmes),
        }),
      });
  
      const response = await request(app)
        .get('/filmes')
        .query({ nome: 'Matrix' });
  
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFilmes);
    });
  
    it('Deve retornar a lista completa de filmes se nenhum filtro for fornecido', async () => {
      // Implemente o mock do método find para simular a busca de filmes sem filtro
      const mockFilmes = [
        { nome: 'Matrix', ano: 1999 },
        { nome: 'Interestelar', ano: 2014 },
      ];
      jest.spyOn(app.locals.db, 'collection').mockReturnValue({
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockFilmes),
        }),
      });
  
      const response = await request(app)
        .get('/filmes');
  
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFilmes);
    });
  });

  describe('Testes da rota /cadastro', () => {
    it('Deve retornar status 500 em caso de erro interno no servidor', async () => {
      // Simulando um erro interno no MongoDB ao tentar inserir o usuário
      jest.spyOn(app.locals.db, 'collection').mockImplementationOnce(() => {
        throw new Error('Erro interno no MongoDB');
      });
  
      const newUser = {
        nome: 'João da Silva',
        senha: '123456',
        dat_nascimento: '2000-01-01',
        email: 'joao@example.com',
      };
  
      const response = await request(app)
        .post('/cadastro')
        .send(newUser);
  
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro interno no servidor' });
    });
  
    it('Deve retornar status 400 e mensagem de erro ao tentar cadastrar usuário com dados incompletos', async () => {
      const incompleteUser = {
        nome: 'Maria Souza',
        senha: '654321',
      };
  
      const response = await request(app)
        .post('/cadastro')
        .send(incompleteUser);
  
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ mensagem: 'Erro: Dados incompletos para cadastro.' });
    });
  
    it('Deve retornar status 400 e mensagem de erro ao tentar cadastrar usuário com email já cadastrado', async () => {
      // Mock do método findOne para simular que o email já está cadastrado
      jest.spyOn(app.locals.db, 'collection').mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ email: 'maria@example.com' }),
      });
  
      const existingUser = {
        nome: 'Maria Souza',
        senha: '654321',
        dat_nascimento: '1995-05-15',
        email: 'maria@example.com',
      };
  
      const response = await request(app)
        .post('/cadastro')
        .send(existingUser);
  
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ mensagem: 'Erro: O email já está cadastrado.' });
    });
  
    it('Deve retornar status 400 e mensagem de erro ao tentar cadastrar usuário menor de 18 anos', async () => {
        const underageUser = {
          nome: 'Joãozinho Silva',
          senha: 'abcdef',
          dat_nascimento: '2010-03-20',
          email: 'joaozinho@example.com',
        };
    
        // Mock do método findOne para simular que o email não está cadastrado
        jest.spyOn(app.locals.db, 'collection').mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        });
    
        const response = await request(app)
          .post('/cadastro')
          .send(underageUser);
    
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ mensagem: 'Erro: O cliente deve ter no mínimo 18 anos.' });
    
        // Restaura o mock após o teste
        jest.restoreAllMocks();
      });
    
  
    it('Deve cadastrar um novo usuário com sucesso', async () => {
      // Mock do método findOne para simular que o email ainda não está cadastrado
      jest.spyOn(app.locals.db, 'collection').mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'mockId' }),
      });
  
      const newUser = {
        nome: 'Ana Oliveira',
        senha: '987654',
        dat_nascimento: '1990-08-10',
        email: 'ana@example.com',
      };
  
      const response = await request(app)
        .post('/cadastro')
        .send(newUser);
  
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mensagem: 'Cliente registrado com sucesso.' });
    });
  });

    describe('PUT /usuario/:id', () => {
        it('should return 404 if user is not found', async () => {
          const invalidUserId = '000000000000000000000000'; // ID fictício que não existe
      
          const response = await request(app)
            .put(`/usuario/${invalidUserId}`)
            .send({ nome: 'Updated Name' });
      
          expect(response.status).toBe(404);
          expect(response.body.mensagem).toBe('Usuário não encontrado.');
        });
      });
  })
