import { NetworkInfo } from '@terra-money/wallet-types';
import { Session } from './session';

export const CreateWeb3AuthPlugin = (
  web3auth: any,
  proxyWalletCoreAddress: string,
  relayerUrl: string,
  chainId: string,
) => {
  return {
    name: 'Email and Socials',
    type: 'WEB3AUTH',
    icon: 'https://tor.us/images/Web3Auth.svg',
    identifier: 'web3auth',
    createSession: async (networks: NetworkInfo[]) => {
      const initedSession = new Session(
        web3auth,
        proxyWalletCoreAddress,
        relayerUrl,
      );
      const network = networks.find((n) => n.chainID === chainId);
      if (!network) {
        throw new Error(`network not found for chain: ${chainId}`);
      }
      initedSession.network = network;
      return initedSession;
    },
  };
};
