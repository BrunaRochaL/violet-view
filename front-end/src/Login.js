import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Form, Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./novo-style.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalName, setModalName] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [modalBirthdate, setModalBirthdate] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const verificarlogin = () => {
    const url = `http://localhost:3001/login?email=${email}&senha=${password}`;

    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.autenticado) {
          alert("Login bem-sucedido!");
          const userInfo = result.userInfo;
          localStorage.setItem("userInfo", JSON.stringify(userInfo));
          navigate("/home");
        } else {
          alert("Email ou senha incorretos.");
        }
      })
      .catch((error) => {
        console.error("Erro:", error);
        alert("Erro ao processar o login.");
      });
  };

  const cadastrarUsuario = () => {
    const currentDate = new Date();
    const idade =
      currentDate.getFullYear() - new Date(modalBirthdate).getFullYear();

    if (idade < 18) {
      alert("Erro: O cliente deve ter no mínimo 18 anos.");
      return;
    }

    const data = {
      nome: modalName,
      email: modalEmail,
      dat_nascimento: modalBirthdate,
      senha: modalPassword,
    };

    fetch("http://localhost:3001/cadastro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.status === 400) {
          alert("Erro: O email já está cadastrado.");
          throw new Error("Email já cadastrado");
        }
        return response.json();
      })
      .then((result) => {
        if (result) {
          alert("Cadastro Registrado!");
          setModalName("");
          setModalEmail("");
          setModalBirthdate("");
          setModalPassword("");
          setShowModal(false);
        }
      })
      .catch((error) => {
        console.error("Erro:", error);
      });
  };

  return (
    <div>
      <Container style={{ backgroundColor: "transparent" }}>
        <Row className="justify-content-center mt-5">
          <Col>
            <div className="login-container">
              <h2 className="text-center mb-4">Login</h2>
              <Form id="loginForm">
                <Form.Group>
                  <Form.Label>Email:</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Insira seu E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Senha:</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Insira sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Group>
                <Button
                  variant="primary"
                  className="btn-block"
                  onClick={verificarlogin}
                >
                  Login
                </Button>
              </Form>
              <p className="mt-3 text-center" style={{ zIndex: "999" }}>
                Ainda não possui cadastro?
                <a
                  href="#"
                  className="cadastro-link"
                  onClick={() => setShowModal(true)}
                >
                  {"   "}Crie sua conta
                </a>
              </p>
            </div>
          </Col>
        </Row>

        <Modal size={"lg"} show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Cadastro</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form id="cadastroForm">
              <Form.Group>
                <Form.Label>Nome:</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Digite seu nome"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>E-mail:</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Data de Nascimento:</Form.Label>
                <Form.Control
                  type="date"
                  value={modalBirthdate}
                  onChange={(e) => setModalBirthdate(e.target.value)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Senha:</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Digite sua senha"
                  value={modalPassword}
                  onChange={(e) => setModalPassword(e.target.value)}
                />
              </Form.Group>
              <Button
                variant="primary"
                className="btn-block mt-4"
                onClick={cadastrarUsuario}
              >
                Cadastrar
              </Button>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
};

export default Login;
