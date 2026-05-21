import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { Button, Form, FormGroup, Label, Input, Card, CardBody, CardTitle } from 'reactstrap';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        axios.post('http://localhost:8000/core/api/signup/', { username, email, password })
            .then(res => {
                alert('Conta criada com sucesso! Podes fazer login agora.');
                navigate('/login');
            })
            .catch(err => {
                console.error("Erro no registo:", err);
                alert('Erro ao criar conta. O username pode já estar em uso.');
            });
    };

    return (
        <div className="mt-5 d-flex justify-content-center">
            <Card className="shadow-sm" style={{ width: '400px' }}>
                <CardBody>
                    <CardTitle tag="h3" className="mb-4 text-center">Criar Conta PlaySphere</CardTitle>
                    <Form onSubmit={handleSubmit}>
                        <FormGroup>
                            <Label>Username</Label>
                            <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </FormGroup>
                        <FormGroup>
                            <Label>E-mail</Label>
                            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="gamer@exemplo.com" />
                        </FormGroup>
                        <FormGroup>
                            <Label>Password</Label>
                            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </FormGroup>
                        <Button color="primary" block type="submit" className="w-100">Registar</Button>
                    </Form>
                </CardBody>
            </Card>
        </div>
    );
};

export default Signup;