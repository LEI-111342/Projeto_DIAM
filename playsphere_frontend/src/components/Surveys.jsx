import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardBody, CardTitle, CardText, Button, Form, FormGroup, Input, Spinner, Badge, Row, Col } from 'reactstrap';
import { useUserContext } from './UserProvider';

const Surveys = () => {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const { userRole } = useUserContext();
    const [novoTitulo, setNovoTitulo] = useState('');
    const [novaDescricao, setNovaDescricao] = useState('');
    const [textosOpcoes, setTextosOpcoes] = useState({});

    const getCSRFToken = () => document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    const carregarInqueritos = () => {
        axios.get('http://localhost:8000/core/api/surveys/', { withCredentials: true })
            .then(res => { setSurveys(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { carregarInqueritos(); }, []);

    const handleCriarInquerito = (e) => {
        e.preventDefault();
        console.log("A enviar para o servidor:", { titulo: novoTitulo, descricao: novaDescricao });

        axios.post('http://localhost:8000/core/api/surveys/',
            { titulo: novoTitulo, descricao: novaDescricao },
            { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true }
        )
        .then(res => {
            console.log("Sucesso do servidor:", res.data);
            alert("✅ Inquérito criado com sucesso!");
            setNovoTitulo('');
            setNovaDescricao('');
            carregarInqueritos();
        })
        .catch(err => {
            console.error("Erro do servidor:", err.response);
            alert("❌ Erro ao criar: " + JSON.stringify(err.response?.data));
        });
    };

    const handleAdicionarOpcao = (surveyId) => {
        const texto = textosOpcoes[surveyId];
        if (!texto) return;
        axios.post(`http://localhost:8000/core/api/surveys/${surveyId}/options/`, { texto }, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
        .then(() => { setTextosOpcoes({ ...textosOpcoes, [surveyId]: '' }); carregarInqueritos(); });
    };

    const handleVotar = (surveyId, optionId) => {
        axios.post(`http://localhost:8000/core/api/surveys/${surveyId}/respond/`, { option: optionId }, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
        .then(() => carregarInqueritos());
    };

    const handleArquivar = (surveyId) => {
        axios.put(`http://localhost:8000/core/api/surveys/${surveyId}/`, {}, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
        .then(() => carregarInqueritos());
    };

    const handleApagarInquerito = (surveyId) => {
        if(window.confirm("Queres mesmo apagar este inquérito e todos os seus votos?")) {
            axios.delete(`http://localhost:8000/core/api/surveys/${surveyId}/`, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
            .then(() => carregarInqueritos());
        }
    };

    const handleApagarOpcao = (optionId) => {
        if(window.confirm("Apagar opção? Os votos associados a ela serão perdidos.")) {
            axios.delete(`http://localhost:8000/core/api/surveys/options/${optionId}/`, { headers: { 'X-CSRFToken': getCSRFToken() }, withCredentials: true })
            .then(() => carregarInqueritos());
        }
    };

    if (loading) return <Spinner color="primary" className="mt-5 d-block mx-auto" />;

    return (
        <div className="mt-4">
            <h2 className="mb-4 text-primary">📊 Inquéritos da Comunidade</h2>

            {userRole === 'ADMIN' && (
                <Card className="shadow-sm border-0 mb-5 bg-light border-start border-4 border-danger">
                    <CardBody>
                        <CardTitle tag="h5" className="text-danger fw-bold mb-3">Painel de Admin: Lançar Inquérito</CardTitle>
                        <Form onSubmit={handleCriarInquerito}>
                            <Row>
                                <Col md={4}>
                                    <Input type="text" placeholder="Pergunta / Título" value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} required />
                                </Col>
                                <Col md={6}>
                                    <Input type="text" placeholder="Contexto ou Descrição" value={novaDescricao} onChange={(e) => setNovaDescricao(e.target.value)} required />
                                </Col>
                                <Col md={2}>
                                    <Button color="danger" type="submit" className="w-100">Criar</Button>
                                </Col>
                            </Row>
                        </Form>
                    </CardBody>
                </Card>
            )}

            {surveys.length === 0 ? <p className="text-muted">Não há inquéritos de momento.</p> : (
                <Row>
                    {surveys.map(survey => (
                        <Col md="6" key={survey.id} className="mb-4">
                            <Card className={`h-100 shadow-sm border-0 ${!survey.ativo ? 'opacity-75' : ''}`}>
                                <CardBody>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <CardTitle tag="h4" className="fw-bold mb-0">{survey.titulo}</CardTitle>
                                        {userRole === 'ADMIN' && (
                                            <Badge color={survey.ativo ? 'success' : 'secondary'}>
                                                {survey.ativo ? '🟢 Ativo' : '🔴 Arquivado'}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardText className="text-muted mb-4">{survey.descricao}</CardText>

                                    <div className="d-grid gap-2 mb-4">
                                        {survey.options && survey.options.length > 0 ? (
                                            survey.options.map(opcao => (
                                                <div key={opcao.id} className="d-flex gap-2">
                                                    <Button
                                                        color={survey.user_voto === opcao.id ? "primary" : "outline-primary"}
                                                        className="text-start flex-grow-1 d-flex justify-content-between"
                                                        onClick={() => handleVotar(survey.id, opcao.id)}
                                                        disabled={userRole !== 'GAMER' || !survey.ativo}
                                                    >
                                                        <span>{opcao.texto} {survey.user_voto === opcao.id && "✅"}</span>
                                                        {(survey.user_voto || userRole === 'ADMIN') && (
                                                            <strong>{opcao.votos_count} votos</strong>
                                                        )}
                                                    </Button>
                                                    {userRole === 'ADMIN' && (
                                                        <Button color="danger" outline onClick={() => handleApagarOpcao(opcao.id)}>X</Button>
                                                    )}
                                                </div>
                                            ))
                                        ) : <p className="text-muted small fst-italic">A aguardar opções...</p>}
                                    </div>

                                    {userRole === 'ADMIN' && (
                                        <div className="mt-3 pt-3 border-top">
                                            <div className="d-flex gap-2 mb-3">
                                                <Input type="text" size="sm" placeholder="Nova opção..." value={textosOpcoes[survey.id] || ''} onChange={(e) => setTextosOpcoes({...textosOpcoes, [survey.id]: e.target.value})} />
                                                <Button color="secondary" size="sm" onClick={() => handleAdicionarOpcao(survey.id)}>Adicionar</Button>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <Button color="warning" size="sm" onClick={() => handleArquivar(survey.id)}>
                                                    {survey.ativo ? '📥 Arquivar Inquérito' : '📤 Desarquivar'}
                                                </Button>
                                                <Button color="danger" size="sm" onClick={() => handleApagarInquerito(survey.id)}>🗑️ Apagar</Button>
                                            </div>
                                        </div>
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
export default Surveys;