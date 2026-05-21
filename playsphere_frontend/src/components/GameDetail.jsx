import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardBody, CardTitle, CardText, Button, Form, FormGroup, Label, Input, Spinner, Badge } from 'reactstrap';
import moment from 'moment';
import { useUserContext } from './UserProvider';

const GameDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, userRole, cart, setCart } = useUserContext();

    const [game, setGame] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [novoRating, setNovoRating] = useState(5);
    const [novoTexto, setNovoTexto] = useState('');
    const [estadoBiblioteca, setEstadoBiblioteca] = useState('QUERO_JOGAR');
    const [respostasTexto, setRespostasTexto] = useState({});

    const getCSRFToken = () => {
        return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    };

    const carregarDados = () => {
        axios.get(`http://localhost:8000/core/api/games/${id}/`)
            .then(res => setGame(res.data))
            .catch(err => console.error(err));

        axios.get(`http://localhost:8000/core/api/games/${id}/reviews/`)
            .then(res => setReviews(res.data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        carregarDados();
    }, [id]);

    const handleAddReview = (e) => {
        e.preventDefault();
        const novaReview = { rating: novoRating, texto: novoTexto };

        axios.post(`http://localhost:8000/core/api/games/${id}/reviews/`, novaReview, {
            headers: { 'X-CSRFToken': getCSRFToken() },
            withCredentials: true
        })
        .then(() => {
            setNovoTexto('');
            setNovoRating(5);
            carregarDados();
        })
        .catch(() => alert("Erro ao publicar review."));
    };

    const handlePublishResponse = (reviewId) => {
        const textoResposta = respostasTexto[reviewId];
        if (!textoResposta) return;

        axios.put(`http://localhost:8000/core/api/reviews/${reviewId}/responder/`, { resposta_publisher: textoResposta }, {
            headers: { 'X-CSRFToken': getCSRFToken() },
            withCredentials: true
        })
        .then(() => {
            alert("Resposta oficial publicada!");
            carregarDados();
        })
        .catch(() => alert("Erro ao enviar resposta."));
    };

    const handleDeleteGame = () => {
        if (window.confirm("Queres apagar este jogo?")) {
            axios.delete(`http://localhost:8000/core/api/games/${id}/`, {
                headers: { 'X-CSRFToken': getCSRFToken() },
                withCredentials: true
            })
            .then(() => { navigate("/"); })
            .catch(() => alert("Sem permissão."));
        }
    };

    const handleAddToLibrary = () => {
        axios.post('http://localhost:8000/core/api/library/', { game: id, estado: estadoBiblioteca }, {
            headers: { 'X-CSRFToken': getCSRFToken() },
            withCredentials: true
        })
        .then(() => alert("✅ Adicionado à biblioteca!"))
        .catch(() => alert("❌ Já adicionado."));
    };

    const handleAddToCart = () => {
        if (cart.find(item => item.id === game.id)) {
            alert("Já está no carrinho!");
            return;
        }
        setCart([...cart, game]);
    };

    if (!game) return <Spinner color="primary" className="mt-5 d-block mx-auto" />;

    const podeEditar = userRole === 'ADMIN' || (userRole === 'PUBLISHER' && game.publisher_nome === user);
    const eDonoDoJogo = game.publisher_nome === user || userRole === 'ADMIN';

    return (
        <div className="mt-4">
            <Button color="secondary" outline className="mb-3" onClick={() => navigate("/")}>
                &larr; Voltar
            </Button>

            <Card className="shadow-sm border-0">
                <CardBody>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-3">
                            <CardTitle tag="h2" className="text-primary mb-0">{game.titulo}</CardTitle>
                            {(userRole === 'ADMIN' || userRole === 'PUBLISHER') && (
                                game.aprovado ? <Badge color="success">Aprovado</Badge> : <Badge color="warning" className="text-dark">Pendente</Badge>
                            )}
                        </div>
                        {podeEditar && (
                            <div className="d-flex gap-2">
                                <Button color="warning" tag={Link} to={`/editar/${game.id}`}>✏️ Editar</Button>
                                <Button color="danger" onClick={handleDeleteGame}>🗑️ Apagar</Button>
                            </div>
                        )}
                    </div>

                    <div className="d-flex align-items-center gap-3 mb-4">
                        <h6 className="text-muted mb-0">Género: {game.genero}</h6>
                        <Badge color={game.preco > 0 ? "success" : "secondary"} className="p-2 fs-6">
                            {game.preco > 0 ? `${game.preco} €` : 'Gratuito'}
                        </Badge>

                        {userRole === 'GAMER' && game.aprovado && (
                            <Button color="warning" size="sm" className="fw-bold text-dark" onClick={handleAddToCart}>
                                🛒 Adicionar ao Carrinho
                            </Button>
                        )}

                        <small className="text-info fst-italic ms-auto">Publicado por: {game.publisher_nome || 'Sistema'}</small>
                    </div>

                    <h5>Descrição do Jogo</h5>
                    <CardText style={{ whiteSpace: "pre-wrap" }}>{game.descricao}</CardText>

                    <hr className="my-4" />

                    {userRole === 'GAMER' && game.aprovado && (
                        <div className="d-flex align-items-center mb-4 p-3 bg-light rounded shadow-sm">
                            <Label className="me-3 mb-0 fw-bold">Adicionar à Biblioteca:</Label>
                            <Input type="select" style={{ width: '200px' }} className="me-3" value={estadoBiblioteca} onChange={(e) => setEstadoBiblioteca(e.target.value)}>
                                <option value="QUERO_JOGAR">Quero Jogar</option>
                                <option value="A_JOGAR">A Jogar</option>
                                <option value="CONCLUIDO">Concluído</option>
                            </Input>
                            <Button color="success" onClick={handleAddToLibrary}>➕ Guardar</Button>
                        </div>
                    )}
                </CardBody>
            </Card>

            <div className="mt-5">
                <h4 className="mb-3">Reviews da Comunidade</h4>
                {reviews.length === 0 ? (
                    <p className="text-muted">Ainda não há reviews.</p>
                ) : (
                    reviews.map(review => (
                        <Card key={review.id} className="mb-3 border-0 bg-light shadow-sm">
                            <CardBody>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        {/* A FOTO DE PERFIL! */}
                                        <img
                                            src={`http://localhost:8000${review.user_imagem}`}
                                            alt="Perfil"
                                            style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                        <strong className="fs-5">{review.nome_utilizador}</strong>
                                    </div>
                                    <span className="text-warning fw-bold fs-5">⭐ {review.rating}/5</span>
                                </div>
                                <p className="mt-2 mb-1">{review.texto}</p>
                                <small className="text-muted">{moment(review.data_submissao).format("DD/MM/YYYY HH:mm")}</small>

                                {review.resposta_publisher && (
                                    <div className="mt-3 p-2 bg-white border-start border-3 border-info rounded-end">
                                        <span className="badge color-info bg-info text-dark mb-1">Resposta Oficial da Empresa</span>
                                        <p className="mb-0 small fst-italic">{review.resposta_publisher}</p>
                                    </div>
                                )}

                                {eDonoDoJogo && !review.resposta_publisher && (
                                    <div className="mt-3">
                                        <Input
                                            type="text"
                                            placeholder="Escreve uma resposta oficial corporativa..."
                                            size="sm"
                                            className="mb-1"
                                            value={respostasTexto[review.id] || ''}
                                            onChange={(e) => setRespostasTexto({...respostasTexto, [review.id]: e.target.value})}
                                        />
                                        <Button color="info" size="sm" onClick={() => handlePublishResponse(review.id)}>
                                            Responder Oficialmente
                                        </Button>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    ))
                )}

                {userRole === 'GAMER' && game.aprovado && (
                    <Card className="bg-light border-0 shadow-sm mt-4">
                        <CardBody>
                            <CardTitle tag="h5">Adicionar uma Review</CardTitle>
                            <Form onSubmit={handleAddReview}>
                                <FormGroup>
                                    <Input type="select" value={novoRating} onChange={(e) => setNovoRating(e.target.value)}>
                                        <option value="5">5 - Obra-prima</option>
                                        <option value="4">4 - Muito Bom</option>
                                        <option value="3">3 - Razoável</option>
                                        <option value="2">2 - Fraco</option>
                                        <option value="1">1 - Horrível</option>
                                    </Input>
                                </FormGroup>
                                <FormGroup>
                                    <Input type="textarea" rows="3" value={novoTexto} onChange={(e) => setNovoTexto(e.target.value)} required placeholder="A tua opinião..." />
                                </FormGroup>
                                <Button color="primary" type="submit">Publicar Review</Button>
                            </Form>
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default GameDetail;