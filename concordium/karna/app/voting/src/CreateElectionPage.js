/* eslint-disable import/no-unresolved */
/* eslint-disable no-console */
/* eslint-disable no-alert */
/* eslint-disable consistent-return */
/* eslint-disable react/jsx-filename-extension */
import React, { useEffect, useState } from 'react';
import { Button, Col, Container, FloatingLabel, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
import { TransactionStatusEnum } from '@concordium/web-sdk';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Wallet, { createElection, init, donateFromProject} from './Wallet';
import { CONTRACT_NAME, MODULE_REF } from './config';

async function addOption(options, setOptions, newOption, setOptionInput) {
    if (options.includes(newOption)) {
        throw new Error(`duplicate option ${newOption}`);
    }
    if (newOption) {
        setOptions([...options, newOption]);
        setOptionInput('');
    }
}

function CreateElectionPage() {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [options, setOptions] = useState([]);
    const [optionInput, setOptionInput] = useState('');

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

    useEffect(()=>{
        if (submittedTxHash !== null){
            donateFromProject(
                client,
                createdContractId,
                amount,
                connectedAccount
            )
            .then(setSubmittedTxHash)
            .catch(console.error);
        }
    })

    return (
        <Container>
            <Row>
                <Col>
                    <Wallet
                        client={client}
                        connectedAccount={connectedAccount}
                        setConnectedAccount={setConnectedAccount}
                    />
                </Col>
            </Row>
            <br />
            <Row>
                <Col>
                    <h2>Description</h2>
                    <FloatingLabel label="Enter description of election.">
                        <Form.Control
                            as="textarea"
                            style={{ height: '100px' }}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </FloatingLabel>
                    <h2>Donation Amount</h2>
                    <Form.Control
                    placeholder="Enter amount to donate from Karna project."
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    />
                    <br />
                    <h2>Options</h2>
                    <ul>
                        {options?.map((opt) => (
                            <li key={opt}>{opt}</li>
                        ))}
                    </ul>
                    <Form
                        onSubmit={(e) => {
                            e.preventDefault();
                            addOption(options, setOptions, optionInput, setOptionInput).catch(console.error);
                        }}
                    >
                        <Row>
                            <Col sm={10}>
                                <InputGroup className="mb-3">
                                    <Form.Control
                                        placeholder="Option"
                                        value={optionInput}
                                        onChange={(e) => setOptionInput(e.target.value)}
                                    />
                                    <Button type="submit" variant="outline-secondary">
                                        Add
                                    </Button>
                                </InputGroup>
                            </Col>
                            <Col sm={1}>
                                <Button type="text" variant="outline-secondary" onClick={() => setOptions([])}>
                                    Clear
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                    <br />
                    {!submittedTxHash && connectedAccount && (
                        <Button
                            className="w-100"
                            onClick={() => {
                                if (options.length === 0) {
                                    alert('Add at least one option!');
                                } else {
                                    createElection(
                                        client,
                                        CONTRACT_NAME,
                                        description,
                                        options,
                                        amount,
                                        MODULE_REF,
                                        connectedAccount
                                    )
                                        .then(setSubmittedTxHash)
                                        .catch(console.error);
                                }
                            }}
                        >
                            Create Campaign
                        </Button>
                    )}
                    {submittedTxHash && !createdContractId && <Spinner animation="border" />}
                </Col>
            </Row>
        </Container>
    );
}

export default CreateElectionPage;
