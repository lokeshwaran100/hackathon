/* eslint-disable react/jsx-filename-extension */
import React, { useEffect, useState } from 'react';
import { Button, Col, Container,Card, FloatingLabel, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
import { TransactionStatusEnum } from '@concordium/web-sdk';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Wallet, { createElection, init, donateToProject } from './Wallet';
import { CONTRACT_NAME, MODULE_REF } from './config';
import Carousel from 'react-bootstrap/Carousel'
import {campaigns} from './data'

function HomePage() {

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [options, setOptions] = useState([]);
    const [optionInput, setOptionInput] = useState('');
    const [campaignAmount, setCampaignAmount] = useState('100');

    const [client, setClient] = useState();
    const [connectedAccount, setConnectedAccount] = useState();

    // Attempt to initialize Browser Wallet Client.
    useEffect(() => {
        init(setConnectedAccount).then(setClient).catch(console.error);
    }, []);

    // Await submitted transaction to be submitted.
    const [submittedTxHash, setSubmittedTxHash] = useState();
    const [createdContractId, setCreatedContractId] = useState();
    useEffect(() => {
        if (client && submittedTxHash && !createdContractId) {
            const interval = setInterval(
                () =>
                    client
                        .getJsonRpcClient()
                        .getTransactionStatus(submittedTxHash)
                        .then((status) => {
                            if (status && status.status === TransactionStatusEnum.Finalized && status.outcomes) {
                                const outcome = Object.values(status.outcomes)[0];
                                if (outcome.result.outcome === 'success') {
                                    const contractIndex = outcome.result.events[0].address.index;
                                    setCreatedContractId(contractIndex);
                                } else {
                                    console.error('creation failed');
                                    setSubmittedTxHash(undefined); // revert state to allow retrying
                                }
                            }
                        })
                        .catch(console.error),
                moment.duration(1, 'second').asMilliseconds()
            );
            return () => clearInterval(interval);
        }
    }, [client, submittedTxHash, createdContractId]);


    return (
        <Container>
            
            <Wallet
                client={client}
                connectedAccount={connectedAccount}
                setConnectedAccount={setConnectedAccount}
            />
            
            <Row>
                <Col className="text-center m-4">
                    <Row>
                        <h1>KARNA</h1>
                    </Row>
                </Col>
            </Row>
            
            <div style={{display:'flex',width:'50%', marginLeft:'auto', marginRight:'auto', justifyContent:'center', flexDirection:'column', alignItems:'center'}}>
                <div className="mb-3">
                    <label htmlFor="campaignAmount" className="form-label">Amount Donated to Project Karna</label>
                    <input
                        placeholder=''
                        defaultValue='100'
                        type="text"
                        className="form-control"
                        id="campaignAmount"
                        value={campaignAmount}
                        onChange={(e) => setCampaignAmount(e.target.value)}
                        required
                    />
                </div>

                <button onClick={() => {
                    donateToProject(
                        client,
                        amount,
                        connectedAccount
                    )
                    .then(setSubmittedTxHash)
                    .catch(console.error);}}

                    className="btn bg-success text-white font-weight-bold py-3 px-4">

                    <strong>DONATE</strong>
                </button>
            </div>

                <div style={{ marginLeft:'auto', marginRight:'auto', padding:'15px', position:'absolute', top:'18px', right:'18px', zIndex:'99999', paddingLeft:'5rem', paddingRight:'5rem'}} className="text-center mt-5">
                    <Link to="/create">
                        <Button className="btn bg-success text-white font-weight-bold py-3 px-4">
                            <strong>Create Campaign</strong>
                        </Button>
                    </Link>
                </div>

                <h1 className='mt-4 text-center'>Currently Running Campaigns</h1>

                <div id='campaigns' style={{ marginTop:'25px', marginLeft:'auto', marginRight:'auto', display:'flex', flexWrap:'wrap', gap:'15px', justifyContent:'center'}}>
                    {
                        campaigns.map((card) => (
                        <Link to={`/campaign/${card.id}`}  key={card.id}>
                            <Card style={{maxWidth:'30rem'}} className='p-2'>
                                <Card.Img variant="top" style={{height:'200px', objectFit:'cover'}} src={`https://picsum.photos/800/500?${card.id}`} />
                                <Card.Body>
                                    <Card.Title>{card.name}</Card.Title>
                                    <Card.Text>
                                    {card.desc}
                                    </Card.Text>
                                    {/* <Row>
                                        <Col><Button href={`/donate?id=${card.id}`} className='w-100' variant="primary">Donate</Button></Col>
                                        <Col><Button href={`/claim?id=${card.id}`} className='w-100' variant="secondary">Claim</Button></Col>
                                    </Row> */}
                                </Card.Body>
                            </Card>
                        </Link>
                        ))
                    }
                </div>

        </Container>
    );
}

export default HomePage;
