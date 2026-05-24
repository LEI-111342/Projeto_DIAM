import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardTitle, CardText, Button, Row, Col, Spinner, Badge, Input, InputGroup, InputGroupText, ListGroup, ListGroupItem } from 'reactstrap';
import moment from 'moment';
import { useUserContext } from './UserProvider';

const GameList = () => {
    const [games, setGames] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [upcomingEventsList, setUpcomingEventsList] = useState([]);
    const [pendingPubs, setPendingPubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, userRole } = useUserContext();

    const [pesquisa, setPesquisa] = useState('');
    const [ordenacao, setOrdenacao] = useState('classificacao');

    const getCSRFToken = () => document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    const carregarDados = () => {
        axios.get('http://localhost:8000/core/api/games/', { withCredentials: true })
            .then(res => { setGames(res.data); setLoading(false); })
            .catch(() => setLoading(false));

        axios.get('http://localhost:8000/core/api/events/upcoming/')
            .then(res => setUpcomingEventsList(res.data));

        if (userRole === 'ADMIN') {
            axios.get('http://localhost:8000/core/api/events/pending/', { withCredentials: true }).then(res => setPendingEvents(res.data));
            axios.get('http://localhost:8000/core/api/publishers/pending/', { withCredentials: true }).then(res => setPendingPubs(res.data));
        }
    };

    useEffect(() => { carregarDados(); }, [userRole]);

    const handleAprovarJogo = (gameId) => {
        axios.put(`http://localhost:8000/core/api/games/${gameId}/approve/`, {}, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true }).then(() => carregarDados());
    };

    const handleAprovarEvento = (eventId) => {
        axios.put(`http://localhost:8000/core/api/events/${eventId}/approve/`, {}, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true }).then(() => carregarDados());
    };

    const handleRejeitarEvento = (eventId) => {
        if(window.confirm("Rejeitar este evento?")) {
            axios.delete(`http://localhost:8000/core/api/events/${eventId}/`, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true }).then(() => carregarDados());
        }
    };

    const handleAprovarEmpresa = (id) => {
        axios.put(`http://localhost:8000/core/api/publishers/${id}/approve/`, {}, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true }).then(() => carregarDados());
    };

    if (loading) return <Spinner color="primary" className="mt-5 d-block mx-auto" />;

    // 1. FILTRAGEM DO CATÁLOGO (Usa o publisher_username para bater certo com a conta)
    let listaProcessada = games.filter(game => {
        if (userRole === 'PUBLISHER' && game.publisher_username !== user) return false;
        if (userRole === 'GAMER' && !game.aprovado) return false;
        if (!user && !game.aprovado) return false;
        if (pesquisa && !game.titulo.toLowerCase().includes(pesquisa.toLowerCase())) return false;
        return true;
    });

    // 2. ORDENAÇÃO DO CATÁLOGO
    listaProcessada.sort((a, b) => {
        if (ordenacao === 'recentes') return b.id - a.id;
        if (ordenacao === 'populares') return b.numero_reviews - a.numero_reviews;
        if (ordenacao === 'classificacao') return b.rating_medio - a.rating_medio;
        if (ordenacao === 'preco_barato') return a.preco - b.preco;
        return 0;
    });

    // 3. FILTRAGEM DA ABA DE EVENTOS (Oculta eventos da concorrência se for Publisher)
    let eventosSideBar = upcomingEventsList;
    if (userRole === 'PUBLISHER') {
        const meusJogosIds = listaProcessada.map(g => g.id);
        eventosSideBar = upcomingEventsList.filter(ev => meusJogosIds.includes(ev.game));
    }

    return (
        <div className="mt-4">
            {userRole === 'ADMIN' && (pendingEvents.length > 0 || pendingPubs.length > 0) && (
                <div className="mb-5 p-4 bg-danger bg-opacity-10 border border-danger border-opacity-50 rounded shadow-sm">
                    <h4 className="text-danger fw-bold mb-3">🛠️ Central de Moderação do Administrador</h4>
                    <Row>
                        {pendingPubs.map(pub => (
                            <Col md="4" key={pub.id} className="mb-3">
                                <Card className="border-danger">
                                    <CardBody>
                                        <Badge color="danger">🏢 Nova Empresa</Badge>
                                        <h6 className="fw-bold mt-2">{pub.nome_empresa}</h6>
                                        <small className="text-muted">Username: {pub.username}</small>
                                        <Button color="danger" size="sm" className="w-100 mt-3" onClick={() => handleAprovarEmpresa(pub.id)}>Autorizar Empresa</Button>
                                    </CardBody>
                                </Card>
                            </Col>
                        ))}
                        {pendingEvents.map(ev => (
                            <Col md="4" key={ev.id} className="mb-3">
                                <Card className="border-warning">
                                    <CardBody>
                                        <Badge color="dark">📅 Evento Pendente</Badge>
                                        <h6 className="fw-bold mt-2">{ev.titulo} ({ev.game_titulo})</h6>
                                        <div className="d-flex gap-2 mt-3">
                                            <Button color="success" size="sm" className="w-50" onClick={() => handleAprovarEvento(ev.id)}>Aceitar</Button>
                                            <Button color="outline-danger" size="sm" className="w-50" onClick={() => handleRejeitarEvento(ev.id)}>Recusar</Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            <Row>
                <Col lg="9">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                        <h2 className="text-primary mb-0 fw-bold">{userRole === 'PUBLISHER' ? '🚀 O Meu Catálogo' : 'Catálogo PlaySphere'}</h2>
                        <div className="d-flex gap-2 w-100" style={{ maxWidth: '450px' }}>
                            <InputGroup size="sm">
                                <InputGroupText>🔍</InputGroupText>
                                <Input placeholder="Procurar jogo..." value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
                            </InputGroup>
                            <Input type="select" size="sm" style={{ maxWidth: '180px' }} value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)}>
                                <option value="classificacao">Melhor Nota</option>
                                <option value="recentes">Mais Recentes</option>
                                <option value="populares">Mais Popularidade</option>
                                <option value="preco_barato">Mais Barato</option>
                            </Input>
                        </div>
                    </div>

                    {listaProcessada.length === 0 ? <p className="text-muted">Nenhum jogo disponível.</p> : (
                        <Row>
                            {listaProcessada.map(game => (
                                <Col sm="6" md="4" key={game.id} className="mb-4">
                                    <Card className="h-100 shadow-sm border-0 position-relative overflow-hidden">
                                        <img src={`http://localhost:8000${game.imagem_principal}`} alt={game.titulo} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                                        <CardBody className="d-flex flex-column">
                                            <CardTitle tag="h5" className="fw-bold mb-1">{game.titulo}</CardTitle>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <small className="text-muted">{game.genero}</small>
                                                <Badge color={game.preco > 0 ? "success" : "secondary"}>{game.preco > 0 ? `${game.preco} €` : 'Grátis'}</Badge>
                                            </div>
                                            <div className="mb-3 small">
                                                <span className="text-warning fw-bold">⭐ {game.rating_medio > 0 ? `${game.rating_medio.toFixed(1)}/10` : 'S/ Nota'}</span>
                                                <span className="text-muted ms-1">({game.numero_reviews} ratings)</span>
                                            </div>
                                            <CardText className="text-truncate text-muted small">{game.descricao}</CardText>
                                            <Button color="primary" size="sm" tag={Link} to={`/jogo/${game.id}`} className="mt-auto w-100">Ver Detalhes</Button>
                                            {userRole === 'ADMIN' && !game.aprovado && (
                                                <Button color="success" size="sm" className="w-100 mt-2" onClick={() => handleAprovarJogo(game.id)}>✅ Aprovar Jogo</Button>
                                            )}
                                        </CardBody>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Col>

                <Col lg="3">
                    <Card className="border-0 shadow-sm bg-light">
                        <CardBody className="p-3">
                            <h5 className="fw-bold text-success mb-3">📅 Próximos Eventos</h5>
                            {eventosSideBar.length === 0 ? (
                                <p className="text-muted small fst-italic">Sem eventos agendados.</p>
                            ) : (
                                <ListGroup flush>
                                    {eventosSideBar.map(ev => (
                                        <ListGroupItem key={ev.id} className="bg-transparent px-0 py-2 border-bottom">
                                            <Link to={`/jogo/${ev.game}#eventos`} className="text-decoration-none fw-bold text-dark d-block text-truncate">{ev.titulo}</Link>
                                            <div className="d-flex justify-content-between align-items-center mt-1">
                                                <Badge color="success" size="sm" className="small">{ev.game_titulo}</Badge>
                                                <small className="text-muted" style={{ fontSize: '11px' }}>{moment(ev.data_evento).format("DD/MM [às] HH:mm")}</small>
                                            </div>
                                        </ListGroupItem>
                                    ))}
                                </ListGroup>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default GameList;