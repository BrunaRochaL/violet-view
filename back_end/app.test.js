const { MongoClient, ObjectId } = require('mongodb');
const request = require('supertest');
const app = require('./app');

describe('API Endpoints', () => {
  let connection;
  let db;

  beforeAll(async () => {
    connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = await connection.db(global.__MONGO_DB_NAME__);
    app.locals.db = db;
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Testes da rota /login', () => {
    it('Deve retornar status 500 em caso de erro interno no servidor', async () => {
      // Simulando erro interno no servidor
      const response = await request(app)
        .get('/login')
        .set('x-simulate-error', 'true')
        .query({ email: 'email@teste.com', senha: 'senha123' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro interno no servidor' });
    });

    it('Deve retornar autenticado:true se o usuário existir', async () => {
      const mockUser = { nome: 'Usuário Teste', email: 'email@teste.com', senha: 'senha123' };
      await db.collection('cadastro').insertOne(mockUser);

      const response = await request(app)
        .get('/login')
        .query({ email: mockUser.email, senha: mockUser.senha });

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
      const response = await request(app)
        .get('/login')
        .query({ email: 'email@inexistente.com', senha: 'senha123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ autenticado: false });
    });
  });

  describe('Testes da rota /filmes', () => {
    it('Deve retornar status 500 em caso de erro interno no servidor', async () => {
      // Simulando erro interno no servidor
      const response = await request(app)
        .get('/filmes')
        .set('x-simulate-error', 'true')
        .query({ nome: 'Matrix' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro interno no servidor' });
    });

    it('Deve retornar a lista de filmes filtrada por nome', async () => {
        const mockFilmes = [
          { nome: 'Matrix', ano: 1999 },
          { nome: 'Interestelar', ano: 2014 },
        ];
      
        // Inserir os filmes de mockFilmes na coleção 'filmes'
        await db.collection('filmes').insertMany(mockFilmes);
      
        // Fazer requisição GET para /filmes?nome=Matrix
        const response = await request(app)
          .get('/filmes')
          .query({ nome: 'Matrix' });
      
        // Montar o array de filmes esperados, removendo o campo _id
        const expectedFilmes = mockFilmes
          .filter(filme => filme.nome === 'Matrix') // Filtrar apenas os filmes com nome 'Matrix'
          .map(({ nome, ano }) => ({ nome, ano }));
      
        // Remover o campo _id dos filmes retornados na resposta
        const filmesWithoutId = response.body.map(({ _id, ...filme }) => filme);
      
        // Asserts para verificar se a resposta corresponde aos filmes esperados
        expect(response.status).toBe(200);
        expect(filmesWithoutId).toEqual(expectedFilmes);
      });
      
      it('Deve retornar a lista completa de filmes se nenhum filtro for fornecido', async () => {
        const mockFilmes = [
          { nome: 'Matrix', ano: 1999 },
          { nome: 'Interestelar', ano: 2014 },
        ];
      
        // Limpar a coleção 'filmes' antes de inserir os dados de mockFilmes
        await db.collection('filmes').deleteMany({});
      
        // Inserir os filmes de mockFilmes na coleção 'filmes'
        await db.collection('filmes').insertMany(mockFilmes);
      
        // Fazer requisição GET para /filmes sem filtro
        const response = await request(app)
          .get('/filmes');
      
        // Montar o array de filmes esperados, removendo o campo _id
        const expectedFilmes = mockFilmes.map(({ nome, ano }) => ({ nome, ano }));
      
        // Remover o campo _id dos filmes retornados na resposta
        const filmesWithoutId = response.body.map(({ _id, ...filme }) => filme);
      
        // Asserts para verificar se a resposta corresponde aos filmes esperados
        expect(response.status).toBe(200);
        expect(filmesWithoutId).toEqual(expectedFilmes);
      });      
  });

  describe('Testes da rota /cadastro', () => {
    it('Deve retornar status 500 em caso de erro interno no servidor', async () => {
      // Simulando erro interno no servidor
      const newUser = { nome: 'Novo Usuário', senha: 'senha123', dat_nascimento: '2000-01-01', email: 'novo@teste.com' };
      const response = await request(app)
        .post('/cadastro')
        .set('x-simulate-error', 'true')
        .send(newUser);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro interno no servidor' });
    });

    it('Deve retornar status 400 e mensagem de erro ao tentar cadastrar usuário com dados incompletos', async () => {
      const newUser = { nome: 'Novo Usuário', senha: 'senha123' }; // Missing dat_nascimento and email
      const response = await request(app)
        .post('/cadastro')
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ mensagem: 'Erro: Dados incompletos para cadastro.' });
    });

    it('Deve retornar status 400 e mensagem de erro ao tentar cadastrar usuário com email já cadastrado', async () => {
      const existingUser = { nome: 'Usuário Existente', senha: 'senha123', dat_nascimento: '2000-01-01', email: 'existente@teste.com' };
      await db.collection('cadastro').insertOne(existingUser);

      const newUser = { nome: 'Novo Usuário', senha: 'senha123', dat_nascimento: '2000-01-01', email: 'existente@teste.com' };
      const response = await request(app)
        .post('/cadastro')
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ mensagem: 'Erro: O email já está cadastrado.' });
    });

    it('Deve retornar status 400 e mensagem de erro ao tentar cadastrar usuário menor de 18 anos', async () => {
      const newUser = { nome: 'Novo Usuário', senha: 'senha123', dat_nascimento: '2010-01-01', email: 'novo@teste.com' }; // Menor de 18 anos
      const response = await request(app)
        .post('/cadastro')
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ mensagem: 'Erro: O cliente deve ter no mínimo 18 anos.' });
    });

    it('Deve cadastrar um novo usuário com sucesso', async () => {
      const newUser = { nome: 'Novo Usuário', senha: 'senha123', dat_nascimento: '2000-01-01', email: 'novo@teste.com' };
      const response = await request(app)
        .post('/cadastro')
        .send(newUser);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mensagem: 'Cliente registrado com sucesso.' });
    });
  });

  describe('PUT /usuario/:id', () => {
    test('Deve retornar 404 se o usuário não for encontrado ao atualizar', async () => {
        const response = await request(app)
            .put('/usuario/999')
            .send({ nome: 'Novo Nome', senha: 'novaSenha123', dat_nascimento: '1990-01-01', email: 'novoemail@example.com' });
    
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ mensagem: 'Usuário não encontrado.' });
    });         
    
    test('Deve atualizar um usuário com sucesso', async () => {
        const mockUser = {
            nome: 'Usuário Teste',
            senha: 'senha123',
            email: 'email@teste.com',
            dat_nascimento: '2000-01-01',
        };
        const { insertedId } = await db.collection('cadastro').insertOne(mockUser);
    
        const response = await request(app)
            .put(`/usuario/${insertedId}`)
            .send({ nome: 'Novo Nome', senha: 'novaSenha123', dat_nascimento: '1990-01-01', email: 'novoemail@example.com' });
    
        expect(response.status).toBe(204);
    });

    test('Deve retornar 200 com mensagem "Nenhum dado foi alterado." se nenhum campo for fornecido ao atualizar usuário', async () => {
        const mockUser = {
            nome: 'Usuário Teste',
            senha: 'senha123',
            email: 'email@teste.com',
            dat_nascimento: '2000-01-01',
        };
        const { insertedId } = await db.collection('cadastro').insertOne(mockUser);
    
        const response = await request(app)
            .put(`/usuario/${insertedId}`)
            .send({}); // Enviar um objeto vazio para simular nenhum campo alterado
    
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ mensagem: 'Nenhum dado foi alterado.' });
    });    

    test('Deve retornar 500 em caso de erro interno ao atualizar usuário', async () => {
        const mockUser = {
            nome: 'Usuário Teste',
            senha: 'senha123',
            email: 'email@teste.com',
            dat_nascimento: '2000-01-01',
        };
        const { insertedId } = await db.collection('cadastro').insertOne(mockUser);
    
        // Simulando erro interno no servidor
        global.conn.query.mockRejectedValueOnce(new Error('Erro interno no servidor'));
    
        const response = await request(app)
            .put(`/usuario/${insertedId}`)
            .send({ nome: 'Novo Nome', senha: 'novaSenha123', dat_nascimento: '1990-01-01', email: 'novoemail@example.com' });
    
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ mensagem: 'Erro interno no servidor' });
    });    
  });

  describe('DELETE /usuario/:id', () => {
    it('Deve retornar 401 ao tentar excluir um usuário que não existe', async () => {
        const response = await request(app)
          .delete('/usuario/000000000000000000000000')
          .send({ senha: 'senha123' });
  
        expect(response.status).toBe(401);
        expect(response.body).toEqual({ mensagem: 'Senha incorreta ou usuário não encontrado.' });
      });
  
      it('Deve excluir um usuário com sucesso', async () => {
        const mockUser = { nome: 'Usuário Teste', senha: 'senha123', email: 'email@teste.com', dat_nascimento: '2000-01-01' };
        const { insertedId } = await db.collection('cadastro').insertOne(mockUser);
  
        const response = await request(app)
          .delete(`/usuario/${insertedId}`)
          .send({ senha: 'senha123' });
  
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ mensagem: 'Conta excluída com sucesso.' });
  
        // Verifica se o usuário foi removido do banco de dados
        const user = await db.collection('cadastro').findOne({ _id: ObjectId(insertedId) });
        expect(user).toBeNull();
      });

    it('Deve retornar 500 em caso de erro interno ao excluir usuário', async () => {
      const mockUser = { nome: 'Usuário Teste', senha: 'senha123', email: 'email@teste.com', dat_nascimento: '2000-01-01' };
      const { insertedId } = await db.collection('cadastro').insertOne(mockUser);

      // Simulando erro interno no servidor
      const response = await request(app)
        .delete(`/usuario/${insertedId}`)
        .set('x-simulate-error', 'true')
        .send({ senha: 'senha123' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro interno no servidor' });
    });

    it('Deve retornar 401 ao tentar excluir um usuário com senha incorreta', async () => {
        // Insira um usuário de teste no banco de dados
        const usuario = {
          nome: 'Teste',
          senha: 'senha_correta',
          dat_nascimento: '1990-01-01',
          email: 'teste@teste.com',
        };
        const { insertedId } = await db.collection('cadastro').insertOne(usuario);
    
        // Faz a requisição DELETE com senha incorreta
        const response = await request(app)
          .delete(`/usuario/${insertedId}`)
          .send({ senha: 'senha_errada' });
    
        // Asserts para verificar se a resposta corresponde ao esperado
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('mensagem', 'Senha incorreta ou usuário não encontrado.');
    
        // Verifica se o usuário ainda existe no banco de dados após a tentativa de exclusão
        const user = await db.collection('cadastro').findOne({ _id: ObjectId(insertedId) });
        expect(user).toBeDefined();
      });    
    })
})