import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardTitle, CardText, Button, Row, Col, Spinner, Badge } from 'reactstrap';
import { useUserContext } from './UserProvider';

const GameList = () => {
    const [games, setGames] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, userRole } = useUserContext();

    const getCSRFToken = () => document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    const carregarDados = () => {
        axios.get('http://localhost:8000/core/api/games/', { withCredentials: true })
            .then(res => { setGames(res.data); setLoading(false); })
            .catch(() => setLoading(false));

        if (userRole === 'ADMIN') {
            axios.get('http://localhost:8000/core/api/events/pending/', { withCredentials: true })
                .then(res => setPendingEvents(res.data));
        } else {
            setPendingEvents([]);
        }
    };

    // A MÁGICA DO REFRESH: Se o userRole mudar (Logout/Login), ele atualiza sozinho!
    useEffect(() => { carregarDados(); }, [userRole]);

    const handleAprovarJogo = (gameId) => {
        axios.put(`http://localhost:8000/core/api/games/${gameId}/approve/`, {}, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
        .then(() => carregarDados());
    };

    const handleAprovarEvento = (eventId) => {
        axios.put(`http://localhost:8000/core/api/events/${eventId}/approve/`, {}, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
        .then(() => carregarDados());
    };

    const handleRejeitarEvento = (eventId) => {
        if(window.confirm("Rejeitar e apagar este evento?")) {
            axios.delete(`http://localhost:8000/core/api/events/${eventId}/`, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
            .then(() => carregarDados());
        }
    };

    if (loading) return <Spinner color="primary" className="mt-5 d-block mx-auto" />;

    const jogosFiltrados = games.filter(game => {
        if (userRole === 'PUBLISHER') return game.publisher_nome === user;
        if (userRole === 'ADMIN') return true;
        return game.aprovado === true;
    });

    return (
        <div className="mt-4">

            {/* O NOVO DASHBOARD DO ADMIN PARA EVENTOS PENDENTES */}
            {userRole === 'ADMIN' && pendingEvents.length > 0 && (
                <div className="mb-5 p-4 bg-warning bg-opacity-10 border border-warning rounded">
                    <h4 className="text-warning text-dark fw-bold mb-3">⚠️ Alerta: Eventos a aguardar aprovação</h4>
                    <Row>
                        {pendingEvents.map(ev => (
                            <Col md="4" key={ev.id} className="mb-3">
                                <Card className="border-warning h-100">
                                    <CardBody>
                                        <Badge color="dark" className="mb-2">Jogo: {ev.game_titulo}</Badge>
                                        <h6 className="fw-bold">{ev.titulo}</h6>
                                        <div className="d-flex gap-2 mt-3">
                                            <Button color="success" size="sm" className="w-50" onClick={() => handleAprovarEvento(ev.id)}>Aprovar</Button>
                                            <Button color="danger" size="sm" className="w-50" onClick={() => handleRejeitarEvento(ev.id)}>Rejeitar</Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            <h2 className="mb-4 text-primary">
                {userRole === 'PUBLISHER' ? '🚀 Painel da Empresa: Os Meus Jogos' : 'Catálogo de Jogos'}
            </h2>
            {jogosFiltrados.length === 0 ? <p className="text-muted">Nenhum jogo encontrado.</p> : (
                <Row>
                    {jogosFiltrados.map(game => (
                        <Col sm="6" md="4" lg="3" key={game.id} className="mb-4">
                            <Card className="h-100 shadow-sm border-0 position-relative">
                                {(userRole === 'ADMIN' || userRole === 'PUBLISHER') && (
                                    <div className="position-absolute top-0 end-0 p-2">
                                        {game.aprovado ? <Badge color="success">✅ Aprovado</Badge> : <Badge color="warning" className="text-dark">⏳ Pendente</Badge>}
                                    </div>
                                )}
                                <CardBody className="d-flex flex-column mt-3">
                                    <CardTitle tag="h5" className="fw-bold">{game.titulo}</CardTitle>
                                    <h6 className="text-muted mb-3">{game.genero}</h6>
                                    <div className="mb-3">
                                        <Badge color={game.preco > 0 ? "success" : "secondary"} className="fs-6 p-2">
                                            {game.preco > 0 ? `${game.preco} €` : 'Gratuito'}
                                        </Badge>
                                    </div>
                                    <CardText className="text-truncate">{game.descricao}</CardText>
                                    <Button color="primary" tag={Link} to={`/jogo/${game.id}`} className="mt-auto w-100 mb-2">Ver Detalhes</Button>

                                    {userRole === 'ADMIN' && !game.aprovado && (
                                        <Button color="success" size="sm" className="w-100" onClick={() => handleAprovarJogo(game.id)}>✅ Aprovar Jogo</Button>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};
export default GameList;