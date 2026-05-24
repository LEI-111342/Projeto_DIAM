import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Form, FormGroup, Label, Input, Button, Card, CardBody, CardTitle, Alert } from 'reactstrap';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('GAMER');
    const [nomeEmpresa, setNomeEmpresa] = useState('');
    const [msg, setMsg] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { username, email, password, role };
        if (role === 'PUBLISHER') payload.nome_empresa = nomeEmpresa;

        axios.post('http://localhost:8000/core/api/signup/', payload)
            .then(() => {
                if (role === 'PUBLISHER') {
                    alert("Conta submetida! Aguarda que um Administrador aprove a tua empresa.");
                } else {
                    alert("Conta de Gamer criada com sucesso!");
                }
                navigate('/login');
            })
            .catch(err => setMsg(err.response?.data?.error || "Erro ao efetuar o registo."));
    };

    return (
        <Card className="shadow-sm border-0 mx-auto mt-5" style={{ maxWidth: '450px' }}>
            <CardBody>
                <CardTitle tag="h3" className="text-center text-primary mb-4 fw-bold">Criar Conta</CardTitle>
                {msg && <Alert color="danger">{msg}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label>Tipo de Perfil</Label>
                        <Input type="select" value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="GAMER">🎮 Jogador (Gamer)</option>
                            <option value="PUBLISHER">🏢 Empresa (Publisher)</option>
                        </Input>
                    </FormGroup>
                    <FormGroup>
                        <Label>Username (Login)</Label>
                        <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </FormGroup>
                    {role === 'PUBLISHER' && (
                        <FormGroup className="p-3 bg-light border rounded">
                            <Label className="fw-bold text-primary">Nome Oficial da Empresa</Label>
                            <Input type="text" placeholder="Ex: Electronic Arts, Indie Studios" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} required />
                        </FormGroup>
                    )}
                    <FormGroup>
                        <Label>E-mail</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </FormGroup>
                    <FormGroup>
                        <Label>Palavra-passe</Label>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </FormGroup>
                    <Button color="primary" type="submit" className="w-100 fw-bold py-2 mt-3">Registar</Button>
                </Form>
            </CardBody>
        </Card>
    );
};

export default Signup;