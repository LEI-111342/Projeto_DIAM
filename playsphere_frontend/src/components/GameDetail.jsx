import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardBody, CardTitle, CardText, Button, Form, FormGroup, Label, Input, Spinner, Badge, Row, Col } from 'reactstrap';
import moment from 'moment';
import { useUserContext } from './UserProvider';

const GameDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, userRole, cart, setCart } = useUserContext();

    const [game, setGame] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [eventos, setEventos] = useState([]);

    const [novoRating, setNovoRating] = useState(5);
    const [novoTexto, setNovoTexto] = useState('');
    const [estadoBiblioteca, setEstadoBiblioteca] = useState('QUERO_JOGAR');
    const [respostasTexto, setRespostasTexto] = useState({});
    const [novoEvento, setNovoEvento] = useState({ titulo: '', descricao: '', data_evento: '' });

    const getCSRFToken = () => document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    const carregarDados = () => {
        axios.get(`http://localhost:8000/core/api/games/${id}/`).then(res => setGame(res.data));
        axios.get(`http://localhost:8000/core/api/games/${id}/reviews/`).then(res => setReviews(res.data));
        axios.get(`http://localhost:8000/core/api/games/${id}/events/`, { withCredentials: true }).then(res => setEventos(res.data));
    };

    useEffect(() => { carregarDados(); }, [id]);

    const handleAddReview = (e) => {
        e.preventDefault();
        axios.post(`http://localhost:8000/core/api/games/${id}/reviews/`, { rating: novoRating, texto: novoTexto }, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
        .then(() => { setNovoTexto(''); setNovoRating(5); carregarDados(); });
    };

    const handlePublishResponse = (reviewId) => {
        if (!respostasTexto[reviewId]) return;
        axios.put(`http://localhost:8000/core/api/reviews/${reviewId}/responder/`, { resposta_publisher: respostasTexto[reviewId] }, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
        .then(() => carregarDados());
    };

    const handleDeleteGame = () => {
        if (window.confirm("Queres apagar este jogo?")) {
            axios.delete(`http://localhost:8000/core/api/games/${id}/`, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
            .then(() => navigate("/"));
        }
    };

    const handleAprovarJogo = () => {
        axios.put(`http://localhost:8000/core/api/games/${id}/approve/`, {}, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
        .then(() => carregarDados());
    };

    const handleAddToLibrary = () => {
        axios.post('http://localhost:8000/core/api/library/', { game: id, estado: estadoBiblioteca }, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
        .then(() => alert("✅ Adicionado à biblioteca!"));
    };

    const handleAddToCart = () => {
        if (cart.find(item => item.id === game.id)) { alert("Já está no carrinho!"); return; }
        setCart([...cart, game]);
    };

    const handleCriarEvento = (e) => {
        e.preventDefault();
        axios.post(`http://localhost:8000/core/api/games/${id}/events/`, novoEvento, { headers: {'X-CSRFToken': getCSRFToken()}, withCredentials: true })
        .then(() => {
            alert("Evento registado! Irá aparecer aos utilizadores assim que for aprovado por um Admin.");
            setNovoEvento({ titulo: '', descricao: '', data_evento: '' });
            carregarDados();
        });
    };

    const handleAprovarEvento = (eventId) => {
        axios.put(`http://localhost:8000/core/api/events/${eventId}/approve/`, {}, { headers: {'X-CSRFToken': getCSRFToken()}, withCredentials: true })
        .then(() => carregarDados());
    };

    const handleApagarEvento = (eventId) => {
        if(window.confirm("Apagar/Rejeitar este evento?")) {
            axios.delete(`http://localhost:8000/core/api/events/${eventId}/`, { headers: {'X-CSRFToken': getCSRFToken()}, withCredentials: true })
            .then(() => carregarDados());
        }
    };

    if (!game) return <Spinner color="primary" className="mt-5 d-block mx-auto" />;

    const podeEditar = userRole === 'ADMIN' || (userRole === 'PUBLISHER' && game.publisher_nome === user);
    const eDonoDoJogo = game.publisher_nome === user || userRole === 'ADMIN';

    return (
        <div className="mt-4">
            <Button color="secondary" outline className="mb-3" onClick={() => navigate("/")}>&larr; Voltar</Button>

            <Card className="shadow-sm border-0 mb-5">
                <CardBody>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-3">
                            <CardTitle tag="h2" className="text-primary mb-0">{game.titulo}</CardTitle>
                            {(userRole === 'ADMIN' || userRole === 'PUBLISHER') && (
                                game.aprovado ? <Badge color="success">Aprovado</Badge> : <Badge color="warning" className="text-dark">Pendente</Badge>
                            )}
                        </div>
                        <div className="d-flex gap-2">
                            {userRole === 'ADMIN' && !game.aprovado && <Button color="success" onClick={handleAprovarJogo}>✅ Aceitar Jogo</Button>}
                            {podeEditar && (
                                <>
                                    <Button color="warning" tag={Link} to={`/editar/${game.id}`}>✏️ Editar</Button>
                                    <Button color="danger" onClick={handleDeleteGame}>🗑️ Apagar</Button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-3 mb-4">
                        <h6 className="text-muted mb-0">Género: {game.genero}</h6>
                        <Badge color={game.preco > 0 ? "success" : "secondary"} className="p-2 fs-6">
                            {game.preco > 0 ? `${game.preco} €` : 'Gratuito'}
                        </Badge>
                        {userRole === 'GAMER' && game.aprovado && <Button color="warning" size="sm" className="fw-bold text-dark" onClick={handleAddToCart}>🛒 Adicionar</Button>}
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

            <div className="mb-5">
                <h4 className="mb-3 text-success">📅 Eventos Oficiais</h4>
                {eventos.length === 0 ? <p className="text-muted">Nenhum evento agendado.</p> : (
                    <Row>
                        {eventos.map(ev => (
                            <Col md="6" key={ev.id} className="mb-3">
                                <Card className={`border-0 shadow-sm ${ev.aprovado ? 'bg-success bg-opacity-10' : 'bg-warning bg-opacity-10 border border-warning'}`}>
                                    <CardBody>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h5 className="fw-bold text-dark mb-0">{ev.titulo}</h5>
                                            {!ev.aprovado && <Badge color="warning" className="text-dark">Pendente</Badge>}
                                        </div>
                                        <p className="small text-muted mb-2"><strong>Data:</strong> {moment(ev.data_evento).format("DD/MM/YYYY HH:mm")}</p>
                                        <p className="mb-3">{ev.descricao}</p>

                                        <div className="d-flex gap-2">
                                            {userRole === 'ADMIN' && !ev.aprovado && (
                                                <Button color="success" size="sm" onClick={() => handleAprovarEvento(ev.id)}>Aprovar</Button>
                                            )}
                                            {/* BOTÃO DE REJEITAR/APAGAR EVENTO PARA ADMINS E DONOS DO JOGO */}
                                            {podeEditar && (
                                                <Button color="danger" outline size="sm" onClick={() => handleApagarEvento(ev.id)}>🗑️ Apagar Evento</Button>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}

                {eDonoDoJogo && (
                    <Card className="mt-4 border-0 shadow-sm bg-light border-start border-4 border-success">
                        <CardBody>
                            <CardTitle tag="h6" className="text-success fw-bold">Criar Novo Evento Oficial</CardTitle>
                            <Form onSubmit={handleCriarEvento}>
                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Input type="text" placeholder="Nome do Evento" required value={novoEvento.titulo} onChange={e => setNovoEvento({...novoEvento, titulo: e.target.value})} />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Input type="datetime-local" required value={novoEvento.data_evento} onChange={e => setNovoEvento({...novoEvento, data_evento: e.target.value})} />
                                        </FormGroup>
                                    </Col>
                                    <Col md={2}><Button color="success" className="w-100" type="submit">Agendar</Button></Col>
                                </Row>
                                <FormGroup className="mb-0">
                                    <Input type="textarea" rows="2" placeholder="Detalhes, regras ou prémios..." required value={novoEvento.descricao} onChange={e => setNovoEvento({...novoEvento, descricao: e.target.value})} />
                                </FormGroup>
                            </Form>
                        </CardBody>
                    </Card>
                )}
            </div>

            <div className="mt-5 border-top pt-4">
                <h4 className="mb-3">Reviews da Comunidade</h4>
                {reviews.length === 0 ? <p className="text-muted">Ainda não há reviews.</p> : (
                    reviews.map(review => (
                        <Card key={review.id} className="mb-3 border-0 bg-light shadow-sm">
                            <CardBody>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <img src={`http://localhost:8000${review.user_imagem}`} alt="Perfil" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                                        <strong className="fs-5">{review.nome_utilizador}</strong>
                                    </div>
                                    <span className="text-warning fw-bold fs-5">⭐ {review.rating}/5</span>
                                </div>
                                <p className="mt-2 mb-1">{review.texto}</p>
                                <small className="text-muted">{moment(review.data_submissao).format("DD/MM/YYYY HH:mm")}</small>

                                {review.resposta_publisher && (
                                    <div className="mt-3 p-2 bg-white border-start border-3 border-info rounded-end">
                                        <span className="badge color-info bg-info text-dark mb-1">Resposta Oficial</span>
                                        <p className="mb-0 small fst-italic">{review.resposta_publisher}</p>
                                    </div>
                                )}

                                {eDonoDoJogo && !review.resposta_publisher && (
                                    <div className="mt-3">
                                        <Input type="text" placeholder="Resposta oficial..." size="sm" className="mb-1"
                                               value={respostasTexto[review.id] || ''} onChange={(e) => setRespostasTexto({...respostasTexto, [review.id]: e.target.value})} />
                                        <Button color="info" size="sm" onClick={() => handlePublishResponse(review.id)}>Responder</Button>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
export default GameDetail;