import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button, Form, FormGroup, Label, Input, Card, CardBody, CardTitle } from 'reactstrap';
import { useUserContext } from './UserProvider';

const AddGame = () => {
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [genero, setGenero] = useState('');
    const [preco, setPreco] = useState(0.00);

    const navigate = useNavigate();
    const { userRole } = useUserContext();

    const getCSRFToken = () => {
        return document.cookie.split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Segurança Extra no Frontend
        if (userRole !== 'ADMIN' && userRole !== 'PUBLISHER') {
            alert("Apenas Publishers e Admins podem adicionar jogos!");
            return;
        }

        const novoJogo = {
            titulo,
            descricao,
            genero,
            preco: parseFloat(preco) // Garante que é enviado como número
        };

        axios.post('http://localhost:8000/core/api/games/', novoJogo, {
            headers: { 'X-CSRFToken': getCSRFToken() },
            withCredentials: true
        })
        .then(() => {
            alert("🎉 Jogo adicionado com sucesso!");
            navigate('/');
        })
        .catch(err => {
            console.error(err);
            alert("Erro ao adicionar jogo. Verifica se tens permissão.");
        });
    };

    // Prevenção visual caso alguém tente forçar o link no browser
    if (userRole !== 'ADMIN' && userRole !== 'PUBLISHER') {
        return <div className="mt-5 alert alert-danger text-center">Acesso Negado.</div>;
    }

    return (
        <div className="mt-5 d-flex justify-content-center">
            <Card className="shadow-sm border-0" style={{ width: '500px' }}>
                <CardBody>
                    <CardTitle tag="h3" className="mb-4 text-primary text-center">Adicionar Novo Jogo</CardTitle>
                    <Form onSubmit={handleSubmit}>
                        <FormGroup>
                            <Label>Título do Jogo</Label>
                            <Input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
                        </FormGroup>
                        <FormGroup>
                            <Label>Género</Label>
                            <Input type="text" value={genero} onChange={(e) => setGenero(e.target.value)} required />
                        </FormGroup>
                        <FormGroup>
                            <Label>Preço (€)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={preco}
                                onChange={(e) => setPreco(e.target.value)}
                                required
                            />
                            <small className="text-muted">Coloca 0 para ser um jogo Gratuito.</small>
                        </FormGroup>
                        <FormGroup>
                            <Label>Descrição</Label>
                            <Input type="textarea" rows="4" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
                        </FormGroup>
                        <Button color="success" block type="submit" className="w-100 mt-3">Guardar Jogo no Catálogo</Button>
                    </Form>
                </CardBody>
            </Card>
        </div>
    );
};

export default AddGame;