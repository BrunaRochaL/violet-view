import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SearchResults = () => {
  const [movies, setMovies] = useState([]);
  const query = new URLSearchParams(useLocation().search).get("query");
  const [searchQuery, setSearchQuery] = useState(query || "");
  const navigate = useNavigate();

  useEffect(() => {
    import("./index-style.css");
  }, []);

  useEffect(() => {
    if (query) {
      fetchMovies(query);
    }
  }, [query]);

  const fetchMovies = (query) => {
    fetch(`http://localhost:3001/search?query=${query}`)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          displayResults(data);
        } else {
          setMovies([]);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar filmes:", error);
        setMovies([]);
      });
  };

  const displayResults = (movies) => {
    setMovies(movies);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${searchQuery}`);
    }
  };

  const showMovieDetails = async (imdbID) => {
    try {
      const response = await fetch(
        `http://www.omdbapi.com/?i=${imdbID}&apikey=2d83b506`
      );
      const movieData = await response.json();

      alert(`Detalhes de ${movieData.Title}:
        Lançamento: ${movieData.Released}
        Gênero: ${movieData.Genre}
        Enredo: ${movieData.Plot}
        Duração: ${movieData.Runtime}`);
    } catch (error) {
      console.error("Erro ao obter detalhes do filme:", error);
    }
  };

  return (
    <div>
      <style>{`
        body {
        background-color: #151515!important
        }
        .movie-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          padding: 20px;
        }
        .movie-item {
          text-align: center;
          border-radius: 8px;
          padding: 10px;
          box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
        }
        .movie-item img {
          max-width: 100%;
          height: auto;
          border-radius: 8px 8px 0 0;
        }
        .movie-details {
          padding: 10px;
          text-align: left;
        }
        .movie-details h2 {
          margin-top: 0;
          font-size: 18px;
        }
        .movie-details p {
          margin: 5px 0;
        }
        .movie-details button {
          padding: 8px 16px;
          background-color: #ff6347;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .movie-details button:hover {
          background-color: #e74c3c;
        }
        .pagination {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }
        .pagination button {
          margin: 0 5px;
          padding: 8px 16px;
          background-color: #ff6347;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .pagination button:hover {
          background-color: #e74c3c;
        }
        .pagination .active {
          background-color: #e74c3c;
        }
      `}</style>
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
          <button id="openNav" className="my-custom-button">
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
              onSubmit={handleSearch}
              style={{ display: "flex", width: "100%" }}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
        </div>
        <div className="container-movies mt-5">
          <div className="content-container">
            <h1>Resultados da Pesquisa</h1>
            <div id="results" className="movie-grid">
              {movies.length > 0 ? (
                movies.map((movie) => (
                  <div className="movie-item" key={movie.imdbID}>
                    <img
                      src={
                        movie.Poster !== "N/A"
                          ? movie.Poster
                          : "/img/no-image.png"
                      }
                      alt={movie.Title}
                    />
                    <div className="movie-details">
                      <h2>{movie.Title}</h2>
                      <p>
                        <strong style={{ color: "#E61D00" }}>
                          Lançamento:
                        </strong>{" "}
                        {movie.Year}
                      </p>
                      <p>
                        <strong style={{ color: "#E61D00" }}>Tipo:</strong>{" "}
                        {movie.Type}
                      </p>
                      <button onClick={() => showMovieDetails(movie.imdbID)}>
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>Nenhum filme encontrado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
