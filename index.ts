import {
  AptosClient,
  AptosAccount,
  FaucetClient,
  BCS,
  TxnBuilderTypes,
} from "aptos";
import assert from "assert";

const NODE_URL =
  process.env.APTOS_NODE_URL || "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL =
  process.env.APTOS_FAUCET_URL || "https://faucet.devnet.aptoslabs.com";

const SWITCHBOARD_DEVNET_ADDRESS = "BLAHBLAHBLAH";

const {
  AccountAddress,
  TypeTagStruct,
  ScriptFunction,
  StructTag,
  TransactionPayloadScriptFunction,
  RawTransaction,
  ChainId,
} = TxnBuilderTypes;

/**
 * Aggregator
 * init
 * addJob
 * openRound
 *
 * Job
 * init
 *
 * Oracle
 * saveResult
 *
 * Crank
 *
 *
 */

interface AggregatorAddJobParams {
  aggregatorAddress: string;
  job: string;
  weight?: number;
}

interface AggregatorInitParams {
  addr: string; // arbitrary key associated with aggregator @NOTE: Cannot be altered
  authority: string; // owner of aggregator
  name?: string;
  metadata?: string;
  queue_address?: string;
  batch_size: number;
  min_oracle_results: number;
  min_job_results: number;
  min_update_delay_seconds: number;
  start_after: number;
  variance_threshold: number;
  force_report_period?: number;
  expiration?: number;
}

interface AggregatorOpenRoundParams {
  aggregator_address: string;
}

interface AggregatorRemoveJobParams {
  aggregatorAddress: string;
  job: string;
}

interface AggregatorSetConfigParams {
  addr: string;
  name?: string;
  metadata?: string;
  queue_address?: string;
  batch_size: number;
  min_oracle_results: number;
  min_job_results: number;
  min_update_delay_seconds: number;
  start_after: number;
  variance_threshold: number;
  force_report_period?: number;
  expiration?: number;
}

interface CrankInitParams {
  addr: string;
  queue_address: string;
}

interface CrankPopParams {
  crank_address: string;
}

interface CrankPushParams {
  crank_address: string;
  aggregator_address: string;
}

interface OracleHeartbeatParams {
  
}

export class AggregatorAccount {
  static async init(client: AptosClient, payer: AptosAccount) {
    const account1 = new AptosAccount();
    // TS SDK support 3 types of transaction payloads: `ScriptFunction`, `Script` and `Module`.
    // See https://aptos-labs.github.io/ts-sdk-doc/ for the details.
    const scriptFunctionPayload = new TransactionPayloadScriptFunction(
      ScriptFunction.natural(
        // Fully qualified module name, `AccountAddress::ModuleName`
        `${SWITCHBOARD_DEVNET_ADDRESS}::Switchboard::AggregatorInitAction`,
        // Module function
        "run",
        [],
        // Arguments for function `transfer`: receiver account address and amount to transfer
        [BCS.b, BCS.bcsSerializeUint64(717)]
      )
    );

    const [{ sequence_number: sequnceNumber }, chainId] = await Promise.all([
      client.getAccount(account1.address()),
      client.getChainId(),
    ]);

    // See class definiton here
    // https://aptos-labs.github.io/ts-sdk-doc/classes/TxnBuilderTypes.RawTransaction.html#constructor.
    const rawTxn = new RawTransaction(
      // Transaction sender account address
      AccountAddress.fromHex(account1.address()),
      BigInt(sequnceNumber),
      scriptFunctionPayload,
      // Max gas unit to spend
      1000n,
      // Gas price per unit
      1n,
      // Expiration timestamp. Transaction is discarded if it is not executed within 10 seconds from now.
      BigInt(Math.floor(Date.now() / 1000) + 10),
      new ChainId(chainId)
    );

    // Sign the raw transaction with account1's private key
    const bcsTxn = AptosClient.generateBCSTransaction(account1, rawTxn);

    const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);

    await client.waitForTransaction(transactionRes.hash);

    const signedTxn = await client.signTransaction(payer, txnRequest);
    const res = await client.submitTransaction(signedTxn);
  }
}