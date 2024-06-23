import React, { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";

const Home = () => {
  const profileContainerRef = useRef(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [openProfileOptions, setOpenProfileOptions] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState({
    nome: "",
    email: "",
    senha: "",
    dat_nascimento: "",
  });

  useEffect(() => {
    const userInfoString = localStorage.getItem("userInfo");
    if (userInfoString) {
      const parsedUserInfo = JSON.parse(userInfoString);
      setUserInfo(parsedUserInfo);
    }
  }, []);

  const handleSidebarToggle = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleProfileModalToggle = () => {
    setProfileModalOpen(!isProfileModalOpen);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (query.trim()) {
      navigate(`/search?query=${query}`);
    }
  };

  const handleProfileOptions = () => {
    setOpenProfileOptions(!openProfileOptions);
  };

  useEffect(() => {
    import("./index-style.css");
    const handleClickOutside = (event) => {
      if (
        profileContainerRef.current &&
        !profileContainerRef.current.contains(event.target)
      ) {
        setOpenProfileOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const confirmarLogout = () => {
    if (window.confirm("Você deseja realmente sair?")) {
      localStorage.clear();
      navigate("/");
    }
  };

  const enableEditMode = () => {
    const inputs = document.querySelectorAll("#profileForm input");
    inputs.forEach((input) => {
      input.disabled = !input.disabled;
    });
    const cadeado = document.getElementById("cadeado");
    cadeado.textContent = cadeado.textContent === "🔒" ? "🔓" : "🔒";
  };

  const updateProfile = () => {
    const { _id } = userInfo;
    const nome = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("password").value;
    const dat_nascimento = document.getElementById("birthdate").value;

    const updatedData = {
      _id,
      nome,
      email,
      senha,
      dat_nascimento,
    };

    fetch(`http://localhost:3001/usuario/${_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    })
      .then((response) => {
        if (response.ok) {
          alert("Seus dados foram atualizados com sucesso!");
          setUserInfo(updatedData);
          localStorage.setItem("userInfo", JSON.stringify(updatedData));
        } else {
          console.error("Erro ao atualizar as informações do perfil.");
        }
      })
      .catch((error) => {
        console.error("Erro ao processar a solicitação:", error);
      });
  };

  const confirmarExclusao = () => {
    const { _id } = userInfo;
    const senha = prompt(
      "Sua conta será excluída permanentemente e todos os seus dados serão apagados! Digite sua senha para confirmar a exclusão:"
    );

    if (senha) {
      fetch(`http://localhost:3001/usuario/${_id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ senha }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erro ao excluir conta");
          }
          return response.json();
        })
        .then((data) => {
          alert("Sua conta foi excluída com sucesso!");
          localStorage.removeItem("userInfo");
          navigate("/");
        })
        .catch((error) => {
          console.error("Erro durante a exclusão:", error.message);
          alert("Falha ao autenticar senha!");
        });
    } else {
      console.error("Senha não fornecida. Exclusão cancelada.");
    }
  };

  return (
    <div>
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&family=Sen:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.2/css/all.min.css"
        />
        <link
          rel="stylesheet"
          href="https://www.w3schools.com/w3css/4/w3.css"
        />
        <title>VioletView</title>
      </head>

      <body>
        <div
          className={
            isSidebarOpen
              ? "w3-sidebar w3-bar-block w3-card w3-animate-left"
              : "w3-sidebar w3-bar-block w3-card w3-animate-left w3-hide"
          }
          id="mySidebar"
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  paddingLeft: "40px",
                }}
              >
                Filmes
              </h3>
              <button
                id="butt"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                }}
                className="w3-bar-item w3-button"
                onClick={handleSidebarToggle}
              >
                X
              </button>
            </div>
            <a
              href="#DOD"
              style={{ display: "flex", justifyContent: "center" }}
              className="w3-bar-item w3-button"
            >
              Doramas
            </a>
            <a
              href="#COM"
              style={{ display: "flex", justifyContent: "center" }}
              className="w3-bar-item w3-button"
            >
              Comédia
            </a>
            <a
              href="#AA"
              style={{ display: "flex", justifyContent: "center" }}
              className="w3-bar-item w3-button"
            >
              Ação e Aventura
            </a>
            <a
              href="#FC"
              style={{ display: "flex", justifyContent: "center" }}
              className="w3-bar-item w3-button"
            >
              Ficção Científica
            </a>
          </div>
        </div>

        <div id="main">
          <div
            id="barra"
            className=""
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#151515",
            }}
          >
            <button
              id="openNav"
              className="my-custom-button"
              onClick={handleSidebarToggle}
            >
              &#9776;
            </button>
            <img src="/img/filmando.png" className="icon-nav-bar" alt="Logo" />
            <div className="logo-container">
              <h1 className="logo">VioletView</h1>
            </div>

            <div
              className="w3-container"
              style={{ display: "flex", alignItems: "center" }}
            >
              <form
                id="searchForm"
                style={{ display: "flex", width: "100%" }}
                onSubmit={handleSearch}
              >
                <input
                  type="text"
                  name="query"
                  placeholder="Pesquisar filmes..."
                  style={{
                    width: "80%",
                    padding: "10px",
                    border: "none",
                    borderRadius: "4px 0 0 4px",
                  }}
                  required
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  type="submit"
                  style={{
                    padding: "10px",
                    border: "none",
                    backgroundColor: "#ff6347",
                    color: "white",
                    borderRadius: "0 4px 4px 0",
                  }}
                >
                  Pesquisar
                </button>
              </form>
            </div>

            <div className="w3-container" style={{ display: "flex" }}>
              <ul id="search-results" className="cards-list"></ul>
              <div className="profile-container" ref={profileContainerRef}>
                <a
                  href="#"
                  className="display-picture"
                  onClick={handleProfileOptions}
                >
                  <img src="/img/profile.jpg" alt="Profile" />
                </a>

                {openProfileOptions && (
                  <div className="card-profile">
                    <div>
                      <ul>
                        <li
                          className="item-conta primeiro-li"
                          onClick={handleProfileModalToggle}
                        >
                          <a href="#">Conta</a>
                        </li>

                        <li
                          className="item-conta segundo-li"
                          onClick={confirmarLogout}
                        >
                          <a href="#">Sair</a>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isProfileModalOpen && (
          <div id="profileModal" className="modal-profile">
            <div className="modal-content">
              <form id="profileForm">
                <span className="close" onClick={handleProfileModalToggle}>
                  &times;
                </span>
                <h2>Conta</h2>
                <label htmlFor="name">Nome:</label>
                <br />
                <input
                  type="text"
                  id="name"
                  name="name"
                  disabled
                  defaultValue={userInfo.nome}
                />
                <span>👤</span>
                <br />

                <label htmlFor="email">E-mail:</label>
                <br />
                <input
                  type="text"
                  id="email"
                  name="email"
                  disabled
                  defaultValue={userInfo.email}
                />
                <span>✉️</span>
                <br />

                <label htmlFor="password">Senha:</label>
                <br />
                <input
                  type="password"
                  id="password"
                  disabled
                  defaultValue={userInfo.senha}
                />
                <span
                  style={{ border: "none", background: "transparent" }}
                  id="cadeado"
                >
                  🔒
                </span>
                <br />

                <label htmlFor="birthdate">Data de Nascimento:</label>
                <br />
                <input
                  type="text"
                  id="birthdate"
                  name="birthdate"
                  disabled
                  defaultValue={userInfo.dat_nascimento}
                />
                <span>📅</span>
                <br />
                <br />

                <button
                  className="form-button"
                  type="button"
                  onClick={enableEditMode}
                >
                  Editar Informações
                </button>
                <br />
                <br />
                <button
                  className="form-button"
                  type="button"
                  onClick={updateProfile}
                >
                  Alterar Informações de Login
                </button>
                <br />
                <br />

                <button
                  className="form-button"
                  id="excluirContaBtn"
                  type="button"
                  onClick={confirmarExclusao}
                >
                  Excluir Conta
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="container-movies">
          <div className="content-container">
            <div
              className="featured-content"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0), #151515), url('img/f-1.jpg')",
              }}
            >
              <img className="featured-title" src="/img/f-t-1.png" alt="" />
              <p className="featured-desc">
                No sul dos Estados Unidos, o ex-escravo Django faz uma aliança
                inesperada com o caçador de recompensas Schultz para caçar os
                criminosos mais procurados do país e resgatar sua esposa de um
                fazendeiro que força seus escravos a participar de competições
                mortais.
              </p>
            </div>

            <div className="movie-list-container">
              <h1 id="DOD" className="movie-list-title">
                Doramas
              </h1>
              <div className="movie-list-wrapper">
                <div className="movie-list">
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/pousando_amor.jpg"
                      alt=""
                    />
                    <span className="movie-list-item-title">
                      Pousando no amor
                    </span>
                    <span className="faixa-etaria-14">Classificação: +14</span>
                    <p className="movie-list-item-desc">
                      Pousando no Amor mostra a paixão entre um oficial da
                      Coreia do Norte e uma empresária sul-coreana que faz um
                      pouso de emergência no país vizinho. O romance é estrelado
                      por Hyun Bin e Son Ye-jin, que também formam um casal na
                      vida real
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/sorriso_real.png"
                      alt=""
                    />
                    <span className="movie-list-item-title">Sorriso Real</span>
                    <span className="faixa-etaria-12">Classificação: +12</span>
                    <p className="movie-list-item-desc">
                      Sorriso Real narra a história de um homem rico e amargo
                      que disputa uma herança na família, e sua persistência em
                      odiar o sorriso de qualquer pessoa por perto, inclusive o
                      de sua nova funcionária, o aproxima de um futuro romance.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/3.jpg"
                      alt=""
                    />
                    <span className="movie-list-item-title">Vincenzo</span>
                    <span className="faixa-etaria-16">Classificação: +16</span>
                    <p className="movie-list-item-desc">
                      Durante uma visita à pátria-mãe, um advogado italiano
                      nascido na Coreia faz justiça ao dar a provar a um cartel
                      dominante um pouco do seu próprio remédio.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/4.jpg"
                      alt=""
                    />
                    <span className="movie-list-item-title">A Lição</span>
                    <span className="faixa-etaria-16">Classificação: +16</span>
                    <p className="movie-list-item-desc">
                      Em A Lição, Moon (Song Hye-kyo) tinha o desejo de se
                      tornar uma arquiteta, mas foi forçada a deixar os estudos
                      por conta de brutais agressões sofridas no colégio.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/5.jpg"
                      alt=""
                    />
                    <span className="movie-list-item-title">
                      Descendentes do sol
                    </span>
                    <span className="faixa-etaria-14">Classificação: +14</span>
                    <p className="movie-list-item-desc">
                      Após um encontro fortuito num hospital, um soldado
                      fervoroso apaixona-se por uma talentosa cirurgiã. As
                      filosofias opostas separam-nos, mas o destino tem outros
                      planos.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/6.jpg"
                      alt=""
                    />
                    <span className="movie-list-item-title">Celebrity</span>
                    <span className="faixa-etaria-12">Classificação: +12</span>
                    <p className="movie-list-item-desc">
                      Uma empresa que administra a carreira de influenciadores
                      vê potencial de sucesso em A-ri. Um telefonema da polícia
                      faz A-ri reencontrar um admirador secreto.
                    </p>
                  </div>
                </div>
                <i className="fas fa-chevron-right arrow"></i>
              </div>
            </div>

            <div className="movie-list-container">
              <h1 id="COM" className="movie-list-title">
                Comédia
              </h1>
              <div className="movie-list-wrapper">
                <div className="movie-list">
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/8.jpg"
                      alt=""
                    />
                    <span className="movie-list-item-title">
                      Minha mãe é uma peça
                    </span>
                    <span className="faixa-etaria-12">Classificação: +12</span>
                    <p className="movie-list-item-desc">
                      Dona Hermínia é uma senhora de meia-idade, divorciada do
                      marido, que a trocou por uma mulher mais jovem.
                      Hiperativa, ela não larga o pé de seus filhos Marcelina e
                      Juliano..
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/9.jpg"
                      alt=""
                    />
                    <span className="movie-list-item-title">As Branquelas</span>
                    <span className="faixa-etaria-16">Classificação: +16</span>
                    <p className="movie-list-item-desc">
                      Dois irmãos agentes do FBI, Marcus e Kevin Copeland,
                      acidentalmente evitam que bandidos sejam presos em uma
                      apreensão de drogas. Como castigo, eles são forçados a
                      escoltar um par de socialites nos Hamptons.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/10.jpg"
                      alt=""
                    />
                    <span className="movie-list-item-title">Doze é demais</span>
                    <span className="faixa-etaria">Classificação: Livre</span>
                    <p className="movie-list-item-desc">
                      Tom e Kate têm 12 filhos e, após o afastamento de alguns
                      deles, tentam reunir a família outra vez em uma casa em um
                      lago onde reencontram um velho rival.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/11.jpg"
                      alt=""
                    />
                    <span className="movie-list-item-title">
                      Todo mundo odeia o Chris
                    </span>
                    <span className="faixa-etaria-12">Classificação: +12</span>
                    <p className="movie-list-item-desc">
                      A narrativa gira em torno do propósito de contar como foi
                      a infância e a adolescência de Chris.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/12.jpg"
                      alt=""
                    />
                    <span className="movie-list-item-title">Gente Grande</span>
                    <span className="faixa-etaria-14">Classificação: +14</span>
                    <p className="movie-list-item-desc">
                      Lenny Feder e sua família se mudam para sua cidade natal
                      para ficar perto dos amigos, mas acabam tendo que
                      enfrentar alguns fantasmas do passado, como a covardia
                      diante de valentões e o famigerado bullying na escola.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/brooklyn.jpg"
                      alt=""
                    />
                    <span className="movie-list-item-title">Brooklyn99</span>
                    <span className="faixa-etaria-14">Classificação: +14</span>
                    <p className="movie-list-item-desc">
                      O brilhante e imaturo detetive Jake Peralta precisa
                      aprender a seguir as regras e trabalhar em equipe quando
                      um capitão exigente assume o comando de seu esquadrão.
                    </p>
                  </div>
                </div>
                <i className="fas fa-chevron-right arrow"></i>
              </div>
            </div>

            <div
              className="featured-content"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0), #151515), url('img/f-2.jpg')",
              }}
            >
              <img className="featured-title" src="/img/f-t-2.png" alt="" />
              <p className="featured-desc">
                Quatro famílias iniciam uma desesperada busca por respostas
                quando uma criança desaparece e um complexo mistério envolvendo
                três gerações começa a se revelar.
              </p>
            </div>

            <div className="movie-list-container">
              <h1 id="AA" className="movie-list-title">
                Ação e Aventura
              </h1>
              <div className="movie-list-wrapper">
                <div className="movie-list">
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/mario_filme.jpg"
                      alt=""
                    />
                    <span className="movie-list-item-title">
                      Super Mario Bros
                    </span>
                    <span className="faixa-etaria">Classificação: Livre</span>
                    <p className="movie-list-item-desc">
                      Mario é um encanador junto com seu irmão Luigi. Um dia,
                      eles vão parar no reino dos cogumelos, governado pela
                      Princesa Peach, mas ameaçado pelo rei dos Koopas, que faz
                      de tudo para conseguir reinar em todos os lugares.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/Crítica-do-Filme-Velozes-e-Furiosos-7.webp"
                      alt=""
                    />
                    <span className="movie-list-item-title">
                      Velozes e Furiosos 7
                    </span>
                    <span className="faixa-etaria-14">Classificação: +14</span>
                    <p className="movie-list-item-desc">
                      Um agente do governo oferece ajuda para cuidar de Shaw em
                      troca de Dom e o grupo resgatar um "hacker" sequestrado.
                      Dessa vez, não se trata apenas de velocidade: a corrida é
                      pela sobrevivência.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/divergente-1"
                      alt=""
                    />
                    <span className="movie-list-item-title">Divergente</span>
                    <span className="faixa-etaria-14">Classificação: +14</span>
                    <p className="movie-list-item-desc">
                      Na futurística cidade de Chicago, ao completar 16 anos,
                      Beatrice precisa escolher entre as diferentes facções em
                      que a cidade está dividida.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/Maze_runner.jpg"
                      alt=""
                    />
                    <span className="movie-list-item-title">Maze Runner</span>
                    <span className="faixa-etaria-14">Classificação: +14</span>
                    <p className="movie-list-item-desc">
                      Em um futuro apocalíptico, o jovem Thomas é escolhido para
                      enfrentar o sistema. Ele acorda dentro de um escuro
                      elevador em movimento e não consegue se lembrar nem de seu
                      nome.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/gato_botas"
                      alt=""
                    />
                    <span className="movie-list-item-title">Gato de Botas</span>
                    <span className="faixa-etaria">Classificação: Livre</span>
                    <p className="movie-list-item-desc">
                      O Gato de Botas descobre que sua paixão pela aventura
                      cobrou seu preço: ele já gastou oito de suas nove vidas.
                      Ele então parte em uma jornada épica para encontrar o
                      mítico Último Desejo.
                    </p>
                  </div>
                </div>
                <i className="fas fa-chevron-right arrow"></i>
              </div>
            </div>

            <div className="movie-list-container">
              <h1 id="FC" className="movie-list-title">
                Ficção Científica
              </h1>
              <div className="movie-list-wrapper">
                <div className="movie-list">
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/avatar.jpeg"
                      alt=""
                    />
                    <span className="movie-list-item-title">Avatar 2</span>
                    <span className="faixa-etaria-12">Classificação: +12</span>
                    <p className="movie-list-item-desc">
                      Após formar uma família, Jake Sully e Ney'tiri fazem de
                      tudo para ficarem juntos. No entanto, eles devem sair de
                      casa e explorar as regiões de Pandora quando uma antiga
                      ameaça ressurge.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/wakanda.jpeg"
                      alt=""
                    />
                    <span className="movie-list-item-title">
                      Pantera Negra 2
                    </span>
                    <span className="faixa-etaria-12">Classificação: +12</span>
                    <p className="movie-list-item-desc">
                      Rainha Ramonda, Shuri, M'Baku, Okoye e Dora Milaje lutam
                      para proteger sua nação das potências mundiais
                      intervenientes após a morte do rei T'Challa.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/Teen_Wolf.webp"
                      alt=""
                    />
                    <span className="movie-list-item-title">Teen Wolf</span>
                    <span className="faixa-etaria-14">Classificação: +14</span>
                    <p className="movie-list-item-desc">
                      O jovem Scott McCall (Tyler Posey) é estudante do ensino
                      médio no colégio fictício de Beacon Hills e vive como um
                      garoto comum, passando por problemas naturais da
                      juventude.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/galaxia.jpg"
                      alt=""
                    />
                    <span className="movie-list-item-title">
                      Guardiões da Galáxia
                    </span>
                    <span className="faixa-etaria-14">Classificação: +14</span>
                    <p className="movie-list-item-desc">
                      O aventureiro do espaço Peter Quill torna-se presa de
                      caçadores de recompensas depois que rouba a esfera de um
                      vilão traiçoeiro, Ronan. Para escapar do perigo, ele faz
                      uma aliança com um grupo de quatro extraterrestres.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/inter.webp"
                      alt=""
                    />
                    <span className="movie-list-item-title">Interestelar</span>
                    <span className="faixa-etaria-14">Classificação: +12</span>
                    <p className="movie-list-item-desc">
                      As reservas naturais da Terra estão chegando ao fim e um
                      grupo de astronautas recebe a missão de verificar
                      possíveis planetas para receberem a população mundial,
                      possibilitando a continuação da espécie.
                    </p>
                  </div>
                  <div className="movie-list-item">
                    <img
                      className="movie-list-item-img"
                      src="/img/Mad_max_capa.jpg"
                      alt=""
                    />
                    <span className="movie-list-item-title">Mad Max</span>
                    <span className="faixa-etaria-16">Classificação: +16</span>
                    <p className="movie-list-item-desc">
                      Após ser capturado por Immortan Joe, um guerreiro das
                      estradas chamado Max (Tom Hardy) se vê no meio de uma
                      guerra mortal, iniciada pela Imperatriz Furiosa (Charlize
                      Theron) na tentativa se salvar um grupo de garotas.
                    </p>
                  </div>
                </div>
                <i className="fas fa-chevron-right arrow"></i>
              </div>
            </div>
          </div>
        </div>

        <script src="appA.js"></script>
      </body>
    </div>
  );
};

export default Home;
