import {
  CreateTxOptions,
  MsgSend,
  MsgExecuteContract,
  LCDClient,
} from '@terra-money/terra.js';
import { WalletPluginSession } from '@terra-money/wallet-controller/modules/wallet-plugin/types';
import { NetworkInfo, TxResult } from '@terra-money/wallet-types';
import Web3 from 'web3';

export class Session implements WalletPluginSession {
  network: NetworkInfo | null;
  terraAddress: string | null;
  account: { ethereum: string } | null;
  provider: any;
  nonce: number;
  constructor(
    private client: any,
    private proxyWalletCoreAddress: string,
    private relayerUrl: string,
  ) {
    this.terraAddress = null;
    this.account = null;
    this.network = null;
    this.nonce = 0;
  }

  async connect(): Promise<any> {
    await this.client.request({ method: 'eth_requestAccounts' });
    const web3 = new Web3(this.client);
    const accounts = await web3.eth.getAccounts();
    this.account = {
      ethereum: accounts[0],
    };
    try {
      this.terraAddress = await this.getProxyWalletAddress();
      this.nonce = await this.getNonce();
    } catch (e) {
      // if error then try to create a new wallet
      const req = new Request(`${this.relayerUrl}/create_wallet`, {
        body: JSON.stringify(this.account),
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      });
      const res = await fetch(req);
      console.log(res);
      const resBody = await res.json();
      if (resBody.proxy_wallet_address) {
        this.terraAddress = resBody.proxy_wallet_address;
      }
    }
  }
  async disconnect(): Promise<void> {}
  async post(tx: CreateTxOptions): Promise<TxResult> {
    const gas = tx.fee?.amount.get('uluna');
    const txToSign = {
      transactions: tx.msgs.map((m) => {
        if (m instanceof MsgSend) {
          return {
            bank: {
              send: {
                to_address: m.to_address,
                amount: m.amount.toData(),
              },
            },
          };
        } else if (m instanceof MsgExecuteContract) {
          return {
            wasm: {
              execute: {
                contract_addr: m.contract,
                msg: m.execute_msg,
                funds: m.coins.toData(),
              },
            },
          };
        }
      }),
      gas: gas
        ? {
            info: { native: gas.denom },
            amount: gas.amount,
          }
        : undefined,
      nonce: this.nonce + 1,
    };
    const message = JSON.stringify(txToSign);
    const signature = (await this.signMessage(message)).replace('0x', '');
    console.log(message, signature);

    const req = new Request(`${this.relayerUrl}/free_tx`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        signature,
        address: this.account,
      }),
      headers: {
        'content-type': 'application/json',
      },
    });
    const res = await fetch(req);
    this.nonce += 1;
    const resBody = await res.json();
    return {
      ...tx,
      result: {
        height: resBody.height,
        raw_log: resBody.raw_log,
        txhash: resBody.txhash,
      },
      success: true,
    };
  }

  async getProxyWalletAddress(): Promise<string> {
    if (!this.network) {
      throw new Error('Network not set');
    }
    const lcd = new LCDClient({
      URL: this.network.lcd,
      chainID: this.network.chainID,
    });
    const wallet = await lcd?.wasm.contractQuery<{
      wallet_address: string;
    }>(this.proxyWalletCoreAddress, {
      wallet_address: this.account,
    });
    return wallet.wallet_address;
  }

  async getNonce(): Promise<number> {
    if (!this.network) {
      throw new Error('Network not set');
    }
    const lcd = new LCDClient({
      URL: this.network.lcd,
      chainID: this.network.chainID,
    });
    const n = await lcd?.wasm.contractQuery<number>(
      this.proxyWalletCoreAddress,
      {
        current_nonce: this.account,
      },
    );
    return n;
  }

  async signMessage(message: string): Promise<string> {
    const web3 = new Web3(this.client);
    const accounts = await web3.eth.getAccounts();
    const signature = await web3.eth.personal.sign(message, accounts[0], '');
    return signature;
  }
}
