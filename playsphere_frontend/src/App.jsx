import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Navbar, NavbarBrand, Nav, NavItem, NavLink, Container, Button, Badge } from 'reactstrap';
import axios from 'axios';

import GameList from './components/GameList';
import GameDetail from './components/GameDetail';
import AddGame from './components/AddGame';
import EditGame from './components/EditGame';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import Library from './components/Library';
import Cart from './components/Cart';
import Forum from './components/Forum';
import ForumPost from './components/ForumPost';
import Surveys from './components/Surveys';
import { useUserContext } from './components/UserProvider';

function App() {
  const { user, setUser, userRole, setUserRole, setUserEmail, cart } = useUserContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    axios.get('http://localhost:8000/core/api/logout/', { withCredentials: true })
      .then(() => {
        setUser(null);
        setUserRole(null);
        setUserEmail('');
        navigate('/');
      })
      .catch(err => console.error("Erro:", err));
  };

  return (
    <div>
      <Navbar color="dark" dark expand="md" className="mb-4">
        <Container>
          <NavbarBrand tag={Link} to="/">🎮 PlaySphere</NavbarBrand>

          <Nav className="me-auto" navbar>
            <NavItem>
              <NavLink tag={Link} to="/">Catálogo</NavLink>
            </NavItem>

            {/* Fórum e Inquéritos ocultos para a empresa (Publisher) */}
            {userRole !== 'PUBLISHER' && (
              <>
                <NavItem>
                  <NavLink tag={Link} to="/forum">💬 Fórum</NavLink>
                </NavItem>
                <NavItem>
                  <NavLink tag={Link} to="/inqueritos">📊 Inquéritos</NavLink>
                </NavItem>
              </>
            )}

            {(userRole === 'ADMIN' || userRole === 'PUBLISHER') && (
              <NavItem>
                <NavLink tag={Link} to="/adicionar">➕ Novo Jogo</NavLink>
              </NavItem>
            )}

            {userRole === 'GAMER' && user && (
              <NavItem>
                <NavLink tag={Link} to="/biblioteca">📚 Minha Biblioteca</NavLink>
              </NavItem>
            )}
          </Nav>

          <Nav navbar>
            {user ? (
              <>
                {userRole === 'GAMER' && (
                  <NavItem className="d-flex align-items-center me-4">
                    <Button color="warning" size="sm" tag={Link} to="/carrinho" className="position-relative fw-bold text-dark">
                      🛒 Carrinho
                      {cart.length > 0 && (
                          <Badge color="danger" pill className="position-absolute top-0 start-100 translate-middle">
                              {cart.length}
                          </Badge>
                      )}
                    </Button>
                  </NavItem>
                )}

                <NavItem className="d-flex align-items-center me-3">
                  <Button color="link" className="text-white text-decoration-none" tag={Link} to="/profile">
                    Olá, <strong>{user}</strong>! <Badge color="info" className="ms-1">{userRole}</Badge>
                  </Button>
                </NavItem>
                <NavItem className="d-flex align-items-center">
                  <Button color="outline-danger" size="sm" onClick={handleLogout}>Sair</Button>
                </NavItem>
              </>
            ) : (
              <>
                <NavItem className="me-2 d-flex align-items-center">
                  <Button color="outline-light" size="sm" tag={Link} to="/login">Entrar</Button>
                </NavItem>
                <NavItem className="d-flex align-items-center">
                  <Button color="primary" size="sm" tag={Link} to="/signup">Criar Conta</Button>
                </NavItem>
              </>
            )}
          </Nav>
        </Container>
      </Navbar>

      <Container>
        <Routes>
          <Route path="/" element={<GameList />} />
          <Route path="/jogo/:id" element={<GameDetail />} />
          <Route path="/adicionar" element={<AddGame />} />
          <Route path="/editar/:id" element={<EditGame />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={user ? <Profile /> : <Login />} />
          <Route path="/biblioteca" element={user ? <Library /> : <Login />} />
          <Route path="/carrinho" element={user ? <Cart /> : <Login />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:id" element={<ForumPost />} />
          <Route path="/inqueritos" element={<Surveys />} />
        </Routes>
      </Container>
    </div>
  );
}

export default App;