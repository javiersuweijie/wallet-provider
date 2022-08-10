import { WalletPlugin } from '@terra-money/wallet-controller/modules/wallet-plugin/types';
import { CreateMetamaskPlugin } from '@terra-money/wallet-plugin-metamask/plugin';
import { CreateWeb3AuthPlugin } from '@terra-money/wallet-plugin-web3auth/plugin';
import {
  getChainOptions,
  WalletControllerChainOptions,
  WalletControllerOptions,
  WalletProvider,
} from '@terra-money/wallet-provider';
import { CHAIN_NAMESPACES } from '@web3auth/base';
import { Web3Auth } from '@web3auth/web3auth';
import { ConnectSample } from 'components/ConnectSample';
import { CW20TokensSample } from 'components/CW20TokensSample';
import { ExecuteSample } from 'components/ExecuteSample';
import { NetworkSample } from 'components/NetworkSample';
import { QuerySample } from 'components/QuerySample';
import { SignBytesSample } from 'components/SignBytesSample';
import { SignSample } from 'components/SignSample';
import { TxSample } from 'components/TxSample';
import React from 'react';
import ReactDOM from 'react-dom';

const clientId =
  'BGw5pmd4M2HxG2tWJnyKfhKMuJJONV_5CzAPAq22h912QOdZFIH-vFiuPr31jyq2sCfsQc1ap4ozwa05RgSQCFI';
const proxyWalletCoreAddress =
  'terra1hy8ts22l72jjq6ur6pcnxdvsh9qpfl2vua9u6m9raytlchf6g5aq04rvye';
const relayerAddress = 'http://localhost:3001';

function App(chainOptions: WalletControllerChainOptions) {
  return (
    <WalletProvider {...chainOptions}>
      <main
        style={{
          margin: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 40,
        }}
      >
        <ConnectSample />
        <QuerySample />
        <TxSample />
        <ExecuteSample />
        <SignSample />
        <SignBytesSample />
        <CW20TokensSample />
        <NetworkSample />
      </main>
    </WalletProvider>
  );
}

async function setupProxyWallet(
  chainOptions: WalletControllerOptions,
): Promise<WalletControllerOptions> {
  const plugins: WalletPlugin[] = [];
  try {
    const web3auth = new Web3Auth({
      clientId,
      chainConfig: {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: '0x1',
        rpcTarget: 'https://rpc.ankr.com/eth', // This is the mainnet RPC we have added, please pass on your own endpoint while creating an app
      },
    });
    await web3auth.initModal();
    plugins.push(
      CreateWeb3AuthPlugin(
        web3auth,
        proxyWalletCoreAddress,
        relayerAddress,
        'pisco-1',
      ),
    );
  } catch (e) {
    console.error('error initializing web3auth', e);
  }

  if ((window as any).ethereum) {
    plugins.push(
      CreateMetamaskPlugin(
        (window as any).ethereum,
        proxyWalletCoreAddress,
        relayerAddress,
        'pisco-1',
      ),
    );
  }

  chainOptions.plugins = plugins;
  return chainOptions;
}

getChainOptions()
  .then(setupProxyWallet)
  .then((chainOptions) => {
    ReactDOM.render(<App {...chainOptions} />, document.getElementById('root'));
  });
