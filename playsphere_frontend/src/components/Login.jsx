import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { useUserContext } from './UserProvider';
import { Button, Form, FormGroup, Label, Input, Card, CardBody, CardTitle } from 'reactstrap';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { setUser, setUserRole } = useUserContext();

    const handleLogin = (e) => {
        e.preventDefault();

        axios.post('http://localhost:8000/core/api/login/', { username, password }, { withCredentials: true })
            .then(() => {
                // Logo após o login, pede os dados completos do utilizador
                axios.get('http://localhost:8000/core/api/user/', { withCredentials: true })
                    .then(res => {
                        setUser(res.data.username);
                        setUserRole(res.data.role); // Atualiza o cargo imediatamente
                        navigate('/');
                    });
            })
            .catch(err => {
                console.error("Erro de login:", err);
                alert('Login falhou. Verifica as tuas credenciais.');
            });
    };

    return (
        <div className="mt-5 d-flex justify-content-center">
            <Card className="shadow-sm" style={{ width: '400px' }}>
                <CardBody>
                    <CardTitle tag="h3" className="mb-4 text-center">Entrar na PlaySphere</CardTitle>
                    <Form onSubmit={handleLogin}>
                        <FormGroup>
                            <Label>Username</Label>
                            <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </FormGroup>
                        <FormGroup>
                            <Label>Password</Label>
                            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </FormGroup>
                        <Button color="success" block type="submit" className="w-100">Fazer Login</Button>
                    </Form>
                </CardBody>
            </Card>
        </div>
    );
};

export default Login;