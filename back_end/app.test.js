const request = require("supertest");
const app = require("./app");

describe("API Endpoints", () => {
  // Mock para simular a coleção de usuários
  const mockUsers = [
    {
      _id: "60914e1adfaed4f7b893721c", // id fictício
      nome: "Usuário Teste",
      email: "email@teste.com",
      senha: "senha123",
      dat_nascimento: "1990-01-01",
    },
  ];

  // Mock para simular métodos de coleção do MongoDB
  const mockCollection = {
    findOne: async (query) => {
      const user = mockUsers.find((u) => u.email === query.email);
      return user;
    },
    insertOne: async (data) => {
      const newUser = {
        _id: "60914e1adfaed4f7b893721d", // id fictício
        ...data,
      };
      mockUsers.push(newUser);
      return { insertedId: newUser._id };
    },
    deleteMany: async () => {
      mockUsers.splice(0, mockUsers.length); // Limpa o array de usuários mockados
    },
  };

  // Substituir a função db.collection com o mock criado
  beforeAll(() => {
    app.locals.db = {
      collection: () => mockCollection,
    };
  });

  describe("Testes da rota /login", () => {
    it("Deve retornar status 500 em caso de erro interno no servidor", async () => {
      const response = await request(app)
        .get("/login")
        .set("x-simulate-error", "true")
        .query({ email: "email@teste.com", senha: "senha123" });
  
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        mensagem: "Erro interno no servidor",
        error: "Simulated server error",
      });
    })

    it("Deve retornar status 400 se email ou senha não forem fornecidos", async () => {
      const response = await request(app)
        .get("/login")
        .query({ email: "email@teste.com" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        mensagem: "Email e senha são obrigatórios.",
      });
    });

    it("Deve retornar autenticado:true se o usuário existir", async () => {
      const response = await request(app)
        .get("/login")
        .query({ email: "email@teste.com", senha: "senha123" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        autenticado: true,
        userInfo: {
          nome: "Usuário Teste",
          email: "email@teste.com",
        },
      });
    });

    it("Deve retornar autenticado:false se o usuário não existir", async () => {
      const response = await request(app)
        .get("/login")
        .query({ email: "email@inexistente.com", senha: "senhaerrada" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ autenticado: false });
    });
  });

  describe("Testes da rota /filmes", () => {
    it("Deve retornar status 500 em caso de erro interno no servidor", async () => {
      const response = await request(app)
        .get("/filmes")
        .set("x-simulate-error", "true")
        .query({ nome: "Matrix" });
    
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Simulated server error",
        mensagem: "Erro interno no servidor",
      });
    });    

    it("Deve retornar a lista de filmes filtrada por nome", async () => {
      const mockFilmes = [
        { _id: 1, nome: "Matrix", ano: 1999 },
        { _id: 2, nome: "Interestelar", ano: 2014 },
      ];
      mockCollection.filmes = mockFilmes;
    
      const response = await request(app)
        .get("/filmes")
        .query({ nome: "Matrix" });
    
      expect(response.status).toBe(200);
      expect(response.body.filmes).toBeDefined();
    
      const expectedFilmes = mockFilmes
        .filter(filme => filme.nome === "Matrix")
        .map(({ _id, ...filme }) => ({
          ...filme,
          // Aqui podemos adicionar qualquer outra propriedade que seja esperada na resposta
        }));
        
      // Verifica se o número de filmes é o mesmo
      expect(response.body.filmes.length).toBe(expectedFilmes.length);
    
      // Verifica se cada filme em response.body.filmes está contido em expectedFilmes
      response.body.filmes.forEach((filme, index) => {
        expect(filme).toEqual(expect.objectContaining(expectedFilmes[index]));
      });
    });
    
    it("Deve retornar a lista completa de filmes se nenhum filtro for fornecido", async () => {
      const mockFilmes = [
        { _id: 1, nome: "Matrix", ano: 1999 },
        { _id: 2, nome: "Interestelar", ano: 2014 },
      ];
      mockCollection.filmes = mockFilmes;
    
      const response = await request(app).get("/filmes");
    
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ filmes: mockFilmes });
    });
  })    

  describe("Testes da rota /cadastro", () => {
    it("Deve retornar status 500 em caso de erro interno no servidor", async () => {
      const newUser = {
        nome: "Novo Usuário",
        senha: "senha123",
        dat_nascimento: "2000-01-01",
        email: "novo@teste.com",
      };
      const response = await request(app)
        .post("/cadastro")
        .set("x-simulate-error", "true")
        .send(newUser);
  
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Simulated server error",
        mensagem: "Erro interno no servidor",
      });
    });
  
    it("Deve retornar status 400 e mensagem de erro ao tentar cadastrar usuário com dados incompletos", async () => {
      const newUser = { nome: "Novo Usuário", senha: "senha123" };
      const response = await request(app).post("/cadastro").send(newUser);
  
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        mensagem:
          "Nome, senha, data de nascimento e email são campos obrigatórios.",
      });
    });
  
    it("Deve retornar status 400 e mensagem de erro ao tentar cadastrar usuário com email já cadastrado", async () => {
      const existingUser = {
        nome: "Usuário Existente",
        senha: "senha123",
        dat_nascimento: "2000-01-01",
        email: "existente@teste.com",
      };
      mockUsers.push(existingUser);
  
      const newUser = {
        nome: "Novo Usuário",
        senha: "senha123",
        dat_nascimento: "2000-01-01",
        email: "existente@teste.com",
      };
      const response = await request(app).post("/cadastro").send(newUser);
  
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        mensagem: "Erro: O email já está cadastrado.",
      });
    });
  
    it("Deve retornar status 400 e mensagem de erro ao tentar cadastrar usuário menor de 18 anos", async () => {
      const newUser = {
        nome: "Novo Usuário",
        senha: "senha123",
        dat_nascimento: "2010-01-01", // Data de nascimento que resulta em idade menor que 18 anos
        email: "novo@teste.com",
      };
      const response = await request(app).post("/cadastro").send(newUser);
  
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        mensagem: "Erro: O cliente deve ter no mínimo 18 anos.",
      });
    });
  
    it("Deve cadastrar um novo usuário com sucesso", async () => {
      const newUser = {
        nome: "Novo Usuário",
        senha: "senha123",
        dat_nascimento: "2000-01-01",
        email: "novo@teste.com",
      };
      const response = await request(app).post("/cadastro").send(newUser);
  
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        mensagem: "Cliente registrado com sucesso.",
      });
    });
  });
      

  describe("PUT /usuario/:id", () => {
    it("Deve retornar 404 se o usuário não for encontrado ao atualizar", async () => {
      const response = await request(app).put("/usuario/999").send({
        nome: "Novo Nome",
        senha: "novaSenha123",
        dat_nascimento: "1990-01-01",
        email: "novoemail@example.com",
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ mensagem: "Usuário não encontrado." });
    });

    it("Deve atualizar um usuário com sucesso", async () => {
      const response = await request(app).put("/usuario/60914e1adfaed4f7b893721c").send({
        nome: "Novo Nome",
        senha: "novaSenha123",
        dat_nascimento: "1990-01-01",
        email: "novoemail@example.com",
      });

      expect(response.status).toBe(204);
    });

    it('Deve retornar 200 com mensagem "Nenhum dado foi alterado." se nenhum campo for fornecido ao atualizar usuário', async () => {
      const response = await request(app)
        .put("/usuario/60914e1adfaed4f7b893721c")
        .send({}); // Enviar um objeto vazio para simular nenhum campo alterado

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mensagem: "Nenhum dado foi alterado." });
    });

    it("Deve retornar 500 em caso de erro interno ao atualizar usuário", async () => {
      const response = await request(app)
        .put("/usuario/60914e1adfaed4f7b893721c")
        .set("x-simulate-error", "true")
        .send({
          nome: "Novo Nome",
          senha: "novaSenha123",
          dat_nascimento: "1990-01-01",
          email: "novoemail@example.com",
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Simulated server error",
        mensagem: "Erro interno no servidor",
      });
    });
  });

  describe("DELETE /usuario/:id", () => {
    it("Deve retornar 401 ao tentar excluir um usuário que não existe", async () => {
      const response = await request(app)
        .delete("/usuario/60914e1adfaed4f7b893721c")
        .send({ senha: "senha123" });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        mensagem: "Senha incorreta ou usuário não encontrado.",
      });
    });

    it("Deve excluir um usuário com sucesso", async () => {
      const response = await request(app)
        .delete("/usuario/60914e1adfaed4f7b893721c")
        .send({ senha: "senha123" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        mensagem: "Conta excluída com sucesso.",
      });

      const user = mockUsers.find((u) => u._id === "60914e1adfaed4f7b893721c");
      expect(user).toBeUndefined(); // Verifica se o usuário foi removido do mock
    });

    it("Deve retornar 500 em caso de erro interno ao excluir usuário", async () => {
      const response = await request(app)
        .delete("/usuario/60914e1adfaed4f7b893721c")
        .set("x-simulate-error", "true")
        .send({ senha: "senha123" });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Simulated server error",
        mensagem: "Erro interno no servidor",
      });
    });

    it("Deve retornar 401 ao tentar excluir um usuário com senha incorreta", async () => {
      const response = await request(app)
        .delete("/usuario/60914e1adfaed4f7b893721c")
        .send({ senha: "senha_errada" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        "mensagem",
        "Senha incorreta ou usuário não encontrado."
      );
    });
  });

  describe("Endpoint /logout", () => {
    it("Deve registrar logout com userId válido", async () => {
      const response = await request(app)
        .post("/logout")
        .send({ userId: "validUserId" });

      expect(response.status).toBe(200);
      expect(response.body.mensagem).toBe("Logout registrado com sucesso.");
    });

    it("Deve retornar erro ao tentar logout sem userId", async () => {
      const response = await request(app).post("/logout").send({});
      expect(response.status).toBe(400);
      expect(response.body.mensagem).toBe("userId é obrigatório.");
    });
  });

  describe("Endpoint /search", () => {
    it("Deve retornar filmes encontrados", async () => {
      const response = await request(app)
        .get("/search")
        .query({ query: "Matrix" });

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("Deve retornar erro para busca sem parâmetros", async () => {
      const response = await request(app).get("/search").query({});
      expect(response.status).toBe(400);
      expect(response.body.mensagem).toBe("Query parameter is required");
    });

    it("Deve retornar 404 quando nenhum filme é encontrado", async () => {
      const response = await request(app)
        .get("/search")
        .query({ query: "noResults" });

      expect(response.status).toBe(404);
      expect(response.body.mensagem).toBe("No movies found");
    });
  });
});
