import { NetworkInfo } from '@terra-money/wallet-types';
import { Session } from './session';

export const CreateMetamaskPlugin = (
  metamask: any,
  proxyWalletCoreAddress: string,
  relayerUrl: string,
  chainId: string,
) => {
  return {
    name: 'Metamask',
    type: 'METAMASK',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    identifier: '',
    createSession: async (networks: NetworkInfo[]) => {
      const initedSession = new Session(
        metamask,
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
