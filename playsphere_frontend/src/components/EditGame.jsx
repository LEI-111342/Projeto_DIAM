import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Form, FormGroup, Label, Input, Card, CardBody, CardTitle, Spinner } from 'reactstrap';
import { useUserContext } from './UserProvider';

const EditGame = () => {
    const { id } = useParams();
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [genero, setGenero] = useState('');
    const [preco, setPreco] = useState(0.00);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    const { userRole } = useUserContext();

    const getCSRFToken = () => {
        return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    };

    useEffect(() => {
        axios.get(`http://localhost:8000/core/api/games/${id}/`)
            .then(res => {
                setTitulo(res.data.titulo);
                setDescricao(res.data.descricao);
                setGenero(res.data.genero);
                setPreco(res.data.preco);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                alert("Erro ao carregar os dados do jogo.");
                navigate('/');
            });
    }, [id, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const dadosAtualizados = {
            titulo,
            descricao,
            genero,
            preco: parseFloat(preco)
        };

        axios.put(`http://localhost:8000/core/api/games/${id}/`, dadosAtualizados, {
            headers: { 'X-CSRFToken': getCSRFToken() },
            withCredentials: true
        })
        .then(() => {
            alert("✅ Jogo atualizado com sucesso!");
            navigate(`/jogo/${id}`);
        })
        .catch(err => {
            console.error(err);
            alert("Erro ao editar o jogo. Apenas o dono ou um Admin podem alterá-lo.");
        });
    };

    if (userRole !== 'ADMIN' && userRole !== 'PUBLISHER') {
        return <div className="mt-5 alert alert-danger text-center">Acesso Negado.</div>;
    }

    if (loading) return <Spinner color="primary" className="mt-5 d-block mx-auto" />;

    return (
        <div className="mt-5 d-flex justify-content-center">
            <Card className="shadow-sm border-0" style={{ width: '500px' }}>
                <CardBody>
                    <CardTitle tag="h3" className="mb-4 text-warning text-center">Editar Jogo</CardTitle>
                    <Form onSubmit={handleSubmit}>
                        <FormGroup>
                            <Label>Título do Jogo</Label>
                            <Input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
                        </FormGroup>
                        <FormGroup>
                            <Label>Género</Label>
                            {/* O DROPDOWN VOLTOU AQUI! */}
                            <Input type="select" value={genero} onChange={(e) => setGenero(e.target.value)} required>
                                <option value="">Selecione um género...</option>
                                <option value="Ação">Ação</option>
                                <option value="Aventura">Aventura</option>
                                <option value="RPG">RPG</option>
                                <option value="Estratégia">Estratégia</option>
                                <option value="Desporto">Desporto</option>
                                <option value="Shooter">Shooter</option>
                            </Input>
                        </FormGroup>
                        <FormGroup>
                            <Label>Preço (€)</Label>
                            <Input type="number" step="0.01" min="0" value={preco} onChange={(e) => setPreco(e.target.value)} required />
                        </FormGroup>
                        <FormGroup>
                            <Label>Descrição</Label>
                            <Input type="textarea" rows="4" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
                        </FormGroup>
                        <div className="d-flex justify-content-between mt-4">
                            <Button color="secondary" outline onClick={() => navigate(`/jogo/${id}`)}>Cancelar</Button>
                            <Button color="warning" type="submit">Atualizar Jogo</Button>
                        </div>
                    </Form>
                </CardBody>
            </Card>
        </div>
    );
};

export default EditGame;