import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Card, CardBody, CardTitle, CardText, Button, Form, FormGroup, Label, Input, Spinner, Badge, Row, Col } from 'reactstrap';
import moment from 'moment';
import { useUserContext } from './UserProvider';

const GameDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hash } = useLocation(); // Lê o final do URL (ex: #eventos)
    const { user, userRole, cart, setCart } = useUserContext();

    const [game, setGame] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [eventos, setEventos] = useState([]);

    const [estadoBiblioteca, setEstadoBiblioteca] = useState('QUERO_JOGAR');
    const [meuItemBiblioteca, setMeuItemBiblioteca] = useState(null);

    const [minhaReview, setMinhaReview] = useState(null);
    const [novoRating, setNovoRating] = useState(10);
    const [novoTexto, setNovoTexto] = useState('');

    const [respostasTexto, setRespostasTexto] = useState({});
    const [novoEvento, setNovoEvento] = useState({ titulo: '', descricao: '', data_evento: '' });
    const [ficheiroGaleria, setFicheiroGaleria] = useState(null);

    const getCSRFToken = () => document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    const carregarDados = () => {
        axios.get(`http://localhost:8000/core/api/games/${id}/`).then(res => setGame(res.data));
        axios.get(`http://localhost:8000/core/api/games/${id}/events/`, { withCredentials: true }).then(res => setEventos(res.data));

        axios.get(`http://localhost:8000/core/api/games/${id}/reviews/`).then(res => {
            setReviews(res.data);
            const minha = res.data.find(r => r.nome_utilizador === user);
            if (minha) {
                setMinhaReview(minha);
                setNovoRating(minha.rating);
                setNovoTexto(minha.texto);
            } else { setMinhaReview(null); setNovoTexto(''); }
        });

        if (userRole === 'GAMER') {
            axios.get('http://localhost:8000/core/api/library/', { withCredentials: true })
            .then(res => {
                const item = res.data.find(i => i.game === parseInt(id));
                if (item) {
                    setMeuItemBiblioteca(item);
                    setEstadoBiblioteca(item.estado);
                    if (!minhaReview && item.nota) setNovoRating(item.nota);
                }
            });
        }
    };

    useEffect(() => { carregarDados(); }, [id, userRole]);

    // LÓGICA DE SCROLL AUTOMÁTICO
    useEffect(() => {
        if (hash === '#eventos' && eventos.length > 0) {
            setTimeout(() => {
                const el = document.getElementById('eventos');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        }
    }, [hash, eventos]);

    const handleAddOrEditReview = (e) => {
        e.preventDefault();
        if (minhaReview) {
            axios.put(`http://localhost:8000/core/api/reviews/${minhaReview.id}/`, { rating: novoRating, texto: novoTexto }, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
            .then(() => { alert("Review atualizada!"); carregarDados(); });
        } else {
            axios.post(`http://localhost:8000/core/api/games/${id}/reviews/`, { rating: novoRating, texto: novoTexto }, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
            .then(() => { alert("Review guardada!"); carregarDados(); });
        }
    };

    const handleApagarReview = (reviewId) => {
        if(window.confirm("Apagar review?")) {
            axios.delete(`http://localhost:8000/core/api/reviews/${reviewId}/`, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true }).then(() => { setMinhaReview(null); setNovoTexto(''); carregarDados(); });
        }
    };

    const handleUploadGaleria = (e) => {
        e.preventDefault();
        if (!ficheiroGaleria) return;
        const formData = new FormData();
        formData.append('imagem', ficheiroGaleria);
        axios.post(`http://localhost:8000/core/api/games/${id}/gallery/`, formData, { headers: { 'X-CSRFToken': getCSRFToken(), 'Content-Type': 'multipart/form-data' }, withCredentials: true })
        .then(() => { alert("Imagem adicionada à galeria!"); setFicheiroGaleria(null); carregarDados(); });
    };

    const handleApagarImagemGaleria = (imgId) => {
        if(window.confirm("Remover imagem da galeria?")) {
            axios.delete(`http://localhost:8000/core/api/gallery/${imgId}/`, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true }).then(() => carregarDados());
        }
    };

    const handlePublishResponse = (reviewId) => {
        if (!respostasTexto[reviewId]) return;
        axios.put(`http://localhost:8000/core/api/reviews/${reviewId}/responder/`, { resposta_publisher: respostasTexto[reviewId] }, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true }).then(() => carregarDados());
    };

    const handleDeleteGame = () => {
        if (window.confirm("Eliminar este jogo?")) {
            axios.delete(`http://localhost:8000/core/api/games/${id}/`, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true }).then(() => navigate("/"));
        }
    };

    const handleAprovarJogo = () => {
        axios.put(`http://localhost:8000/core/api/games/${id}/approve/`, {}, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true }).then(() => carregarDados());
    };

    const handleAddToLibrary = () => {
        axios.post('http://localhost:8000/core/api/library/', { game: id, estado: estadoBiblioteca }, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true }).then(() => { alert("Adicionado!"); carregarDados(); });
    };

    // NOVA FUNÇÃO: Atualiza logo o estado se o jogo já estiver na biblioteca
    const handleMudarEstadoBiblioteca = (novoEstado) => {
        setEstadoBiblioteca(novoEstado);
        if (meuItemBiblioteca) {
            axios.put(`http://localhost:8000/core/api/library/${meuItemBiblioteca.id}/`,
                { estado: novoEstado },
                { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true }
            ).then(() => alert("✅ Estado da biblioteca atualizado!"));
        }
    };

    const handleAddToCart = () => {
        if (cart.find(item => item.id === game.id)) { alert("Já está no carrinho!"); return; }
        setCart([...cart, game]);
    };

    const handleCriarEvento = (e) => {
        e.preventDefault();
        axios.post(`http://localhost:8000/core/api/games/${id}/events/`, novoEvento, { headers: {'X-CSRFToken': getCSRFToken()}, withCredentials: true }).then(() => { alert("Evento agendado!"); setNovoEvento({ titulo: '', descricao: '', data_evento: '' }); carregarDados(); });
    };

    const handleAprovarEvento = (eventId) => {
        axios.put(`http://localhost:8000/core/api/events/${eventId}/approve/`, {}, { headers: {'X-CSRFToken': getCSRFToken()}, withCredentials: true }).then(() => carregarDados());
    };

    const handleApagarEvento = (eventId) => {
        if(window.confirm("Apagar evento?")) {
            axios.delete(`http://localhost:8000/core/api/events/${eventId}/`, { headers: {'X-CSRFToken': getCSRFToken()}, withCredentials: true }).then(() => carregarDados());
        }
    };

    if (!game) return <Spinner color="primary" className="mt-5 d-block mx-auto" />;

    const podeEditar = userRole === 'ADMIN' || (userRole === 'PUBLISHER' && game.publisher_nome === user);
    const eDonoDoJogo = game.publisher_nome === user || userRole === 'ADMIN';

    return (
        <div className="mt-4">
            <Button color="secondary" outline className="mb-3" onClick={() => navigate("/")}>&larr; Voltar</Button>

            <Card className="shadow-sm border-0 mb-4 overflow-hidden">
                <div style={{ position: 'relative', height: '240px' }}>
                    <img src={`http://localhost:8000${game.imagem_principal}`} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }} />
                    <div style={{ position: 'absolute', bottom: '20px', left: '20px' }} className="text-white">
                        <h1 className="fw-bold mb-1">{game.titulo}</h1>
                        <Badge color="info" className="me-2">{game.genero}</Badge>
                        <Badge color="success">{game.preco > 0 ? `${game.preco} €` : 'Gratuito'}</Badge>
                    </div>
                </div>
                <CardBody>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <span className="text-warning fw-bold fs-5">⭐ {game.rating_medio > 0 ? `${game.rating_medio.toFixed(1)}/10` : 'Sem Notas'}</span>
                            <small className="text-muted ms-2">({game.numero_reviews} classificações na comunidade)</small>
                        </div>
                        <div className="d-flex gap-2">
                            {userRole === 'ADMIN' && !game.aprovado && <Button color="success" size="sm" onClick={handleAprovarJogo}>Aceitar Jogo</Button>}
                            {podeEditar && (
                                <>
                                    <Button color="warning" size="sm" tag={Link} to={`/editar/${game.id}`}>✏️ Editar</Button>
                                    <Button color="danger" size="sm" onClick={handleDeleteGame}>🗑️ Eliminar</Button>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="lead bg-light p-3 rounded" style={{ whiteSpace: "pre-wrap" }}>{game.descricao}</p>
                    <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">Publicado corporativamente por: <strong>{game.publisher_nome}</strong></small>
                        {userRole === 'GAMER' && game.aprovado && (
                            <div className="d-flex gap-2">
                                <Button color="warning" size="sm" onClick={handleAddToCart}>🛒 Carrinho</Button>
                                <Input type="select" size="sm" style={{ width: '140px' }} value={estadoBiblioteca} onChange={(e) => handleMudarEstadoBiblioteca(e.target.value)}>
                                    <option value="QUERO_JOGAR">Quero Jogar</option>
                                    <option value="A_JOGAR">A Jogar</option>
                                    <option value="CONCLUIDO">Concluído</option>
                                </Input>
                                {!meuItemBiblioteca && <Button color="success" size="sm" onClick={handleAddToLibrary}>Guardar</Button>}
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            <Card className="border-0 shadow-sm mb-4 bg-light">
                <CardBody>
                    <h4 className="fw-bold text-secondary mb-3">📸 Galeria de Imagens</h4>
                    {game.galeria && game.galeria.length === 0 ? <p className="text-muted small fst-italic">Sem imagens adicionadas.</p> : (
                        <Row className="g-2">
                            {game.galeria.map(img => (
                                <Col xs="6" sm="4" md="3" key={img.id} className="position-relative group">
                                    <img src={`http://localhost:8000${img.imagem}`} alt="Galeria" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px' }} />
                                    {podeEditar && (
                                        <Button color="danger" size="sm" style={{ position: 'absolute', top: '5px', right: '10px', padding: '1px 6px' }} onClick={() => handleApagarImagemGaleria(img.id)}>X</Button>
                                    )}
                                </Col>
                            ))}
                        </Row>
                    )}
                    {podeEditar && (
                        <Form onSubmit={handleUploadGaleria} className="mt-3 pt-3 border-top d-flex gap-2 align-items-center">
                            <Input type="file" accept="image/*" required onChange={e => setFicheiroGaleria(e.target.files[0])} />
                            <Button color="secondary" size="sm" type="submit">Adicionar Foto</Button>
                        </Form>
                    )}
                </CardBody>
            </Card>

            <div className="mb-5" id="eventos">
                <h4 className="mb-3 text-success fw-bold">📅 Eventos Deste Jogo</h4>
                {eventos.length === 0 ? <p className="text-muted small">Sem eventos registados.</p> : (
                    <Row>
                        {eventos.map(ev => (
                            <Col md="6" key={ev.id} className="mb-3">
                                <Card className={`border-0 shadow-sm ${ev.aprovado ? 'bg-success bg-opacity-10' : 'bg-warning bg-opacity-10'}`}>
                                    <CardBody>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h6 className="fw-bold m-0">{ev.titulo}</h6>
                                            {!ev.aprovado && <Badge color="warning text-dark">Pendente</Badge>}
                                        </div>
                                        <small className="text-muted d-block my-1">Data: {moment(ev.data_evento).format("DD/MM/YYYY HH:mm")}</small>
                                        <p className="small m-0 text-secondary">{ev.descricao}</p>
                                        <div className="mt-2">
                                            {userRole === 'ADMIN' && !ev.aprovado && <Button color="success" size="sm" className="me-2" onClick={() => handleAprovarEvento(ev.id)}>Aprovar</Button>}
                                            {podeEditar && <Button color="danger" outline size="sm" onClick={() => handleApagarEvento(ev.id)}>Apagar</Button>}
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
                {eDonoDoJogo && (
                    <Card className="border-0 shadow-sm p-3 bg-light">
                        <Form onSubmit={handleCriarEvento}>
                            <Row className="g-2">
                                <Col md={6}><Input type="text" placeholder="Título do Evento" required value={novoEvento.titulo} onChange={e => setNovoEvento({...novoEvento, titulo: e.target.value})} /></Col>
                                <Col md={4}><Input type="datetime-local" required value={novoEvento.data_evento} onChange={e => setNovoEvento({...novoEvento, data_evento: e.target.value})} /></Col>
                                <Col md={2}><Button color="success" className="w-100" type="submit">Agendar</Button></Col>
                            </Row>
                            <Input type="textarea" rows="2" className="mt-2" placeholder="Regras/Descrição..." required value={novoEvento.descricao} onChange={e => setNovoEvento({...novoEvento, descricao: e.target.value})} />
                        </Form>
                    </Card>
                )}
            </div>

            <div className="mt-4 border-top pt-3">
                <h4 className="fw-bold mb-3">Comunidade e Opiniões</h4>
                {reviews.map(review => (
                    <Card key={review.id} className="mb-3 border-0 bg-light shadow-sm">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <img src={`http://localhost:8000${review.user_imagem}`} alt="Avatar" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                                    <strong>{review.nome_utilizador}</strong>
                                </div>
                                <div>
                                    <Badge color="warning" className="text-dark me-2">⭐ {review.rating}/10</Badge>
                                    {(review.nome_utilizador === user || userRole === 'ADMIN') && (
                                        <Button color="link" className="text-danger p-0" onClick={() => handleApagarReview(review.id)}>Apagar</Button>
                                    )}
                                </div>
                            </div>
                            <p className="mt-2 small mb-1">{review.texto}</p>
                            {review.resposta_publisher && (
                                <div className="mt-2 p-2 bg-white border-start border-3 border-info rounded">
                                    <small className="text-info fw-bold d-block">Resposta Oficial da Empresa:</small>
                                    <span className="small fst-italic">{review.resposta_publisher}</span>
                                </div>
                            )}
                            {eDonoDoJogo && !review.resposta_publisher && (
                                <div className="mt-2 d-flex gap-2">
                                    <Input type="text" placeholder="Responder..." size="sm" onChange={e => setRespostasTexto({...respostasTexto, [review.id]: e.target.value})} />
                                    <Button color="info" size="sm" onClick={() => handlePublishResponse(review.id)}>Enviar</Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                ))}

                {userRole === 'GAMER' && game.aprovado && (
                    <Form onSubmit={handleAddOrEditReview} className="p-3 bg-light rounded mt-3">
                        <h6>{minhaReview ? "✏️ Editar a tua Review" : "📝 Adicionar Review"}</h6>
                        <FormGroup>
                            <Input type="select" value={novoRating} onChange={e => setNovoRating(e.target.value)}>
                                {[...Array(10).keys()].reverse().map(n => <option key={n+1} value={n+1}>⭐ {n+1}/10</option>)}
                            </Input>
                        </FormGroup>
                        <FormGroup><Input type="textarea" placeholder="Texto da review..." required value={novoTexto} onChange={e => setNovoTexto(e.target.value)} /></FormGroup>
                        <Button color="primary" size="sm" type="submit">{minhaReview ? "Gravar Alterações" : "Submeter"}</Button>
                    </Form>
                )}
            </div>
        </div>
    );
};

export default GameDetail;