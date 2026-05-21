import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardBody, CardTitle, CardText, Button, Form, FormGroup, Input, Spinner } from 'reactstrap';
import moment from 'moment';
import { useUserContext } from './UserProvider';

const ForumPost = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, userRole } = useUserContext();

    const [post, setPost] = useState(null);
    const [comentarios, setComentarios] = useState([]);
    const [novoComentario, setNovoComentario] = useState('');

    const getCSRFToken = () => {
        return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    };

    const carregarDados = () => {
        axios.get(`http://localhost:8000/core/api/forum/${id}/`)
            .then(res => setPost(res.data))
            .catch(() => navigate('/forum'));

        axios.get(`http://localhost:8000/core/api/forum/${id}/comments/`)
            .then(res => setComentarios(res.data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        carregarDados();
    }, [id]);

    const handleAdicionarComentario = (e) => {
        e.preventDefault();
        axios.post(`http://localhost:8000/core/api/forum/${id}/comments/`, { conteudo: novoComentario }, {
            headers: { 'X-CSRFToken': getCSRFToken() },
            withCredentials: true
        })
        .then(() => {
            setNovoComentario('');
            carregarDados();
        })
        .catch(() => alert("Erro ao publicar comentário."));
    };

    const handleApagarPost = () => {
        if (window.confirm("Atenção: Queres mesmo apagar este tópico inteiro?")) {
            axios.delete(`http://localhost:8000/core/api/forum/${id}/`, {
                headers: { 'X-CSRFToken': getCSRFToken() },
                withCredentials: true
            })
            .then(() => navigate('/forum'))
            .catch(() => alert("Sem permissão."));
        }
    };

    const handleApagarComentario = (commentId) => {
        if (window.confirm("Apagar este comentário?")) {
            axios.delete(`http://localhost:8000/core/api/forum/comments/${commentId}/`, {
                headers: { 'X-CSRFToken': getCSRFToken() },
                withCredentials: true
            })
            .then(() => carregarDados())
            .catch(() => alert("Sem permissão."));
        }
    };

    if (!post) return <Spinner color="primary" className="mt-5 d-block mx-auto" />;

    const podeApagarPost = userRole === 'ADMIN' || post.autor_nome === user;

    return (
        <div className="mt-4">
            <Button color="secondary" outline className="mb-3" tag={Link} to="/forum">
                &larr; Voltar ao Fórum
            </Button>

            <Card className="shadow-sm border-primary border-2 mb-4">
                <CardBody>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <CardTitle tag="h2" className="text-primary fw-bold mb-0">{post.titulo}</CardTitle>
                        {podeApagarPost && (
                            <Button color="danger" size="sm" onClick={handleApagarPost}>🗑️ Apagar Tópico</Button>
                        )}
                    </div>
                    <div className="d-flex align-items-center gap-3 mb-4 text-muted border-bottom pb-3">
                        <img
                            src={`http://localhost:8000${post.autor_imagem}`}
                            alt="Perfil"
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span className="fs-5 text-dark fw-bold">{post.autor_nome}</span>
                        <span className="ms-auto">🕒 {moment(post.data_criacao).format("DD/MM/YYYY HH:mm")}</span>
                    </div>
                    <CardText style={{ whiteSpace: "pre-wrap", fontSize: "1.1rem" }}>{post.conteudo}</CardText>
                </CardBody>
            </Card>

            <h4 className="mb-3">Respostas ({comentarios.length})</h4>

            {comentarios.length === 0 ? (
                <p className="text-muted mb-4">Ainda ninguém respondeu a este tópico.</p>
            ) : (
                <div className="mb-4">
                    {comentarios.map(comentario => {
                        const podeApagarComentario = userRole === 'ADMIN' || comentario.autor_nome === user;
                        return (
                            <Card key={comentario.id} className="mb-2 shadow-sm border-0 bg-light">
                                <CardBody className="py-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <img
                                                src={`http://localhost:8000${comentario.autor_imagem}`}
                                                alt="Perfil"
                                                style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                            <strong className="text-dark">{comentario.autor_nome}</strong>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <small className="text-muted">{moment(comentario.data_criacao).format("DD/MM/YYYY HH:mm")}</small>
                                            {podeApagarComentario && (
                                                <Button color="link" className="text-danger p-0 text-decoration-none" onClick={() => handleApagarComentario(comentario.id)}>
                                                    🗑️ Excluir
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <CardText className="mb-0 mt-2 ms-5" style={{ whiteSpace: "pre-wrap" }}>{comentario.conteudo}</CardText>
                                </CardBody>
                            </Card>
                        )
                    })}
                </div>
            )}

            {user && userRole === 'GAMER' && (
                <Card className="shadow-sm border-0 mt-4">
                    <CardBody>
                        <h5 className="mb-3">Escrever uma resposta</h5>
                        <Form onSubmit={handleAdicionarComentario}>
                            <FormGroup>
                                <Input type="textarea" rows="3" value={novoComentario} onChange={(e) => setNovoComentario(e.target.value)} required />
                            </FormGroup>
                            <Button color="success" type="submit">Submeter Resposta</Button>
                        </Form>
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

export default ForumPost;