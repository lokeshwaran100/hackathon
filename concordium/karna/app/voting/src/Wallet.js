/* eslint-disable no-alert */
/* eslint-disable no-console */
/* eslint-disable consistent-return */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-plusplus */
import React from 'react';
import { detectConcordiumProvider } from '@concordium/browser-wallet-api-helpers';
import { Alert, Button } from 'react-bootstrap';
import { RAW_SCHEMA_BASE64, TESTNET_GENESIS_BLOCK_HASH, MAIN_CONTRACT_NAME_ID } from './config';
import {
    AccountTransactionType,
    CcdAmount,
    ModuleReference,
    serializeUpdateContractParameters,
    toBuffer,
} from '@concordium/web-sdk';
import moment from 'moment';
export async function init(setConnectedAccount) {
    const client = await detectConcordiumProvider();
    // Listen for relevant events from the wallet.
    client.on('accountChanged', (account) => {
        console.debug('browserwallet event: accountChange', { account });
        setConnectedAccount(account);
    });
    client.on('accountDisconnected', () => {
        console.debug('browserwallet event: accountDisconnected');
        client.getMostRecentlySelectedAccount().then(setConnectedAccount);
    });
    client.on('chainChanged', (chain) => {
        console.debug('browserwallet event: chainChanged', { chain });
    });
    client.getMostRecentlySelectedAccount().then(setConnectedAccount);

    return client;
}

export async function connect(client, setConnectedAccount) {
    const account = await client.connect();
    return setConnectedAccount(account);
}

// Check if the user is connected to the testnet chain by checking if the testnet genesisBlock exists.
// The smart contract voting module is deployed on the testnet chain.
async function checkConnectedToTestnet(client) {
    return client
        .getJsonRpcClient()
        .getCryptographicParameters(TESTNET_GENESIS_BLOCK_HASH.toString())
        .then((result) => {
            if (result === undefined || result?.value === null) {
                window.alert('Check if your Concordium browser wallet is connected to testnet!');
                return false;
            }
            return true;
        });
}
export async function donateToProject(client, amountToDonate, senderAddress) {
    const amount = Number.parseInt(amountToDonate, 10);
    const connectedToTestnet = await checkConnectedToTestnet(client);
    if (connectedToTestnet) {
        const txHash = await client.sendTransaction(
            senderAddress,
            AccountTransactionType.Update,
            {
                amount: new CcdAmount(BigInt(amountToDonate)),
                address: { index: BigInt(MAIN_CONTRACT_NAME_ID), subindex: BigInt(0) },
                receiveName: 'karna.donate',
                maxContractExecutionEnergy: BigInt(30000),
            }
        );
        console.log({ txHash });
        return txHash;
    }
}

export async function createElection(
    client,
    contractName,
    description,
    options,
    amount,
    moduleRef,
    senderAddress
) {
    const connectedToTestnet = await checkConnectedToTestnet(client);

    if (connectedToTestnet) {
        const parameter = {};

        const txHash = await client.sendTransaction(
            senderAddress,
            AccountTransactionType.InitContract,
            {
                amount: new CcdAmount(BigInt(0)),
                moduleRef: new ModuleReference(moduleRef),
                initName: contractName,
                maxContractExecutionEnergy: BigInt(30000),
            }
        );
        console.log({ txHash });
        return txHash;
    }
}

export async function getView(client, contractIndex) {
    return client.getJsonRpcClient().invokeContract({
        contract: { index: BigInt(contractIndex), subindex: BigInt(0) },
        method: 'voting.view',
    });
}

export async function getVotes(client, contractIndex, numOptions) {
    const promises = [];

    for (let i = 0; i < numOptions; i++) {
        const param = serializeUpdateContractParameters(
            'voting',
            'getNumberOfVotes',
            {
                vote_index: i,
            },
            toBuffer(RAW_SCHEMA_BASE64, 'base64')
        );

        const promise = client.getJsonRpcClient().invokeContract({
            contract: { index: BigInt(contractIndex), subindex: BigInt(0) },
            method: 'voting.getNumberOfVotes',
            parameter: param,
        });

        promises.push(promise);
    }

    return Promise.all(promises);
}

export async function castVote(client, contractIndex, amountToDonate, senderAddress) {
    const amount = Number.parseInt(amountToDonate, 10);
    const connectedToTestnet = await checkConnectedToTestnet(client);
    if (connectedToTestnet) {
        const txHash = await client.sendTransaction(
            senderAddress,
            AccountTransactionType.Update,
            {
                amount: new CcdAmount(BigInt(amount)),
                address: { index: BigInt(contractIndex), subindex: BigInt(0) },
                receiveName: 'karnacampaign01.donate',
                maxContractExecutionEnergy: BigInt(30000),
            }
        );
        console.log({ txHash });
        return txHash;
    }
}

export async function claimAmount(client, contractIndex, amountToClaim, senderAddress) {
    const amount = Number.parseInt(amountToClaim, 10);
    const parameter = {
        "amount": amountToClaim
    };
    const connectedToTestnet = await checkConnectedToTestnet(client);
    if (connectedToTestnet) {
        const txHash = await client.sendTransaction(
            senderAddress,
            AccountTransactionType.Update,
            {
                amount: new CcdAmount(BigInt(0)),
                address: { index: BigInt(contractIndex), subindex: BigInt(0) },
                receiveName: 'karnacampaign01.claim',
                maxContractExecutionEnergy: BigInt(30000),
            },
            parameter,
            RAW_SCHEMA_BASE64
        );
        console.log({ txHash });
        return txHash;
    }
}

export default function Wallet(props) {
    const { client, connectedAccount, setConnectedAccount } = props;
    return (
        <>
            {!connectedAccount && (
                <>
                    <p>No wallet connection</p>
                    <Button onClick={() => connect(client, setConnectedAccount).catch(console.error)}>Connect</Button>
                </>
            )}
            {connectedAccount && (
                <Alert variant="success">
                    Connected to account <code>{connectedAccount}</code>.
                </Alert>
            )}
        </>
    );
}
