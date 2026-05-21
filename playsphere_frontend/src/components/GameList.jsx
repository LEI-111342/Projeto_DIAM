import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardTitle, CardText, Button, Row, Col, Spinner, Badge } from 'reactstrap';
import { useUserContext } from './UserProvider';

const GameList = () => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const { userRole } = useUserContext();

    const getCSRFToken = () => {
        return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    };

    const carregarJogos = () => {
        axios.get('http://localhost:8000/core/api/games/', { withCredentials: true })
            .then(res => {
                setGames(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        carregarJogos();
    }, []);

    const handleAprovar = (gameId) => {
        axios.put(`http://localhost:8000/core/api/games/${gameId}/approve/`, {}, {
            headers: { 'X-CSRFToken': getCSRFToken() },
            withCredentials: true
        })
        .then(() => {
            alert("Jogo Aprovado com sucesso!");
            carregarJogos();
        })
        .catch(() => alert("Erro ao aprovar jogo."));
    };

    if (loading) return <Spinner color="primary" className="mt-5 d-block mx-auto" />;

    return (
        <div className="mt-4">
            <h2 className="mb-4 text-primary">
                {userRole === 'PUBLISHER' ? '🚀 Painel da Empresa: Os Meus Jogos' : 'Catálogo de Jogos'}
            </h2>
            {games.length === 0 ? (
                <p className="text-muted">Nenhum jogo encontrado nesta listagem.</p>
            ) : (
                <Row>
                    {games.map(game => (
                        <Col sm="6" md="4" lg="3" key={game.id} className="mb-4">
                            <Card className="h-100 shadow-sm border-0 position-relative">
                                {/* BADGE DE APROVAÇÃO PARA ADMIN/PUBLISHER */}
                                {(userRole === 'ADMIN' || userRole === 'PUBLISHER') && (
                                    <div className="position-absolute top-0 end-0 p-2">
                                        {game.aprovado ?
                                            <Badge color="success">✅ Aprovado</Badge> :
                                            <Badge color="warning" className="text-dark">⏳ Pendente</Badge>
                                        }
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

                                    <CardText className="text-truncate">
                                        {game.descricao}
                                    </CardText>

                                    <Button color="primary" tag={Link} to={`/jogo/${game.id}`} className="mt-auto w-100">
                                        Ver Detalhes
                                    </Button>

                                    {/* BOTÃO DE APROVAÇÃO PARA O ADMIN */}
                                    {userRole === 'ADMIN' && !game.aprovado && (
                                        <Button color="success" size="sm" className="mt-2 w-100" onClick={() => handleAprovar(game.id)}>
                                            Aprovar Jogo
                                        </Button>
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