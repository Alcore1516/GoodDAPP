import { EIP1193Provider } from '@web3-onboard/common'
import React, {
  useState,
  useEffect,
  useCallback
} from 'react'
import { Web3Provider } from '@ethersproject/providers'
import { ChainId } from '@sushiswap/sdk'
import { WalletState } from '@web3-onboard/core'
import type { Account } from '@web3-onboard/core/dist/types'
import { Web3ReactContextInterface } from '@web3-react/core/dist/types'
import web3Utils from 'web3-utils'
import { SupportedChainId } from 'sdk/constants/chains'
import { UnsupportedChainId } from 'sdk/utils/errors'
import { OnboardChainIds } from 'connectors'

import { 
  useConnectWallet,
  useSetChain,
  useWallets
} from '@web3-onboard/react'

export type IsSupportedChainId = {
  isSupported: boolean,
  chainId: string
}

type OnboardConnectProps = {
  activated: boolean,
  tried: boolean
}

export type ActiveOnboard<T= any> = Omit<Web3ReactContextInterface<Web3Provider>, 'activate' | 'deactivate' | 'setError' | 'connector'>

export interface EIP1193ProviderExtended extends EIP1193Provider {
  providers?: any
  isMetamask?: boolean,
  selectedProvider: {
    isMetaMask?: boolean, 
    on?: (...args: any[]) => void,
    off?: (...args: any[]) => void,
    removeListener?: (...args: any[]) => void,
    removeAllListeners?: (...args: any[]) => void,
    autoRefreshOnNetworkChange?: boolean,
    request?: (args: {
      method: string;
      params?: unknown[] | object;
  }) => Promise<unknown>,
  } | null
}

export interface ActiveOnboardInterface<T = any> extends ActiveOnboard<Web3Provider> {
  active: boolean,
  accounts?: Account[],
  eipProvider?: EIP1193ProviderExtended,
  chainId: ChainId,
  chainIdHex?: string,
  account?: string,
  label?: string,
  error?: Error | undefined
}

export function IsSupportedChain(chainIdHex: string):IsSupportedChainId {
  const chainId = parseInt(chainIdHex)
  const isSupported = Object.values(SupportedChainId).includes(chainId)
  const supportedChainHex = isSupported ? chainIdHex : '0x1'
  return {isSupported: isSupported, chainId: supportedChainHex}
}

export function onboardContext(wstate: WalletState[]):ActiveOnboardInterface {
  const [{ provider, label, accounts, chains }] = wstate
  const web3provider = new Web3Provider(provider)
  const chainIdHex = chains[0].id
  const {isSupported, chainId} = IsSupportedChain(chainIdHex)
  const error = !isSupported ? new UnsupportedChainId(chainIdHex) : undefined

  const newContext = {
    active: true,
    accounts: accounts,
    chainId: parseInt(chainId),
    account: web3Utils.toChecksumAddress(accounts[0].address),
    label: label,
    eipProvider: provider as EIP1193ProviderExtended, 
    library: web3provider,
    error: error

  }
  return newContext
}

export function useActiveOnboard<T = any>():ActiveOnboardInterface<T> {
  const [context, setContext] = useState<ActiveOnboardInterface<Web3Provider>>({active: false, chainId: 1})
  const connectedWallets = useWallets()
  useEffect(() => {
    if (connectedWallets.length > 0) {      
      const newContext = onboardContext(connectedWallets)
      setContext(newContext)
    } else {
      setContext({active: false, chainId: 1})
    }
  }, [connectedWallets])

  return context
}


/** Store connected wallet data in localStorage to be used for eagerly connecting on page-load
 * @param wallets all currently connected wallets
 * @param activeChainId active chain id is the currently connected chain if supported, else it defaults to mainnet
 * @returns void
 */
 export function StoreOnboardState(wallets:WalletState[], activeChainId:string | undefined):void {
  if (wallets.length === 0){
    localStorage.removeItem('connectedWallets') 
  } else {
    const walletLabel = wallets.map(({ label }) => label)
    const connectedAccount = wallets.map(({accounts}) => accounts[0])
    const connectedChain = activeChainId     
    const connected = [{
      accounts: connectedAccount,
      chains: connectedChain,
      label: walletLabel}
    ]
    localStorage.setItem(
      'connectedWallets',
      JSON.stringify(connected)
    )
  }
}

// TODO: Seperate current connected wallet && ALL connected wallets
// TODO: Handle multiple accounts connected
/**
 * Used for eagerly connecting on page-load when a previous wallet connection exists
 * while also keeping track of any state updates (disconnect / switching chains)
 * @returns tried & activated
 */
export function useOnboardConnect():OnboardConnectProps {
  const [tried, setTried] = useState<boolean>(false)
  const [activated, setActivated] = useState<boolean>(false)
  const [{ wallet, connecting}, connect, disconnect] = useConnectWallet()
  const [ {chains, connectedChain, settingChain}, setChain] = useSetChain()
  const connectedWallets = useWallets()
  const balance = connectedWallets[0]?.accounts[0]?.balance

  const previouslyConnected:any = JSON.parse(
    localStorage.getItem('connectedWallets') ?? '{}'
  )
  
  const updateStorage = (newChainId:string, currentWallet:WalletState[], type:string) => {
    const { chainId } = IsSupportedChain(newChainId)

    if (type === 'init') setChain({chainId})
    StoreOnboardState(currentWallet, chainId)
    setActivated(true)
  }

  const chainChanged = useCallback((newChainId:string) => {
    if (balance){
      const isUpdated = Object.keys(balance)[0] === OnboardChainIds[parseInt(newChainId)]
      if (isUpdated) {
        updateStorage(newChainId, connectedWallets, 'switch')
      }
    }
  }, [balance])

  // TODO: Handle user rejection (patch fixed in @web3-onboard/core for now)

  // eager connect
  useEffect(() => {
    async function connectOnboard() {
      // Coinbase reloads instead of sending accountsChanged event, so empty storage if no active address can be found
      if (previouslyConnected[0].label[0] === 'Coinbase'){ 
        const isStillActive = localStorage.getItem('-walletlink:https://www.walletlink.org:Addresses')
        if (!isStillActive){
          localStorage.removeItem('connectedWallets')
          setTried(true)
          return
        }
      }
      // disableModals:true for silently connecting
      connect({ autoSelect: { label: previouslyConnected[0].label[0], disableModals: true}})
    }
    if (previouslyConnected[0] && !tried){
      connectOnboard()
      setTried(true)
    } else if (activated || !previouslyConnected[0]) {
      setTried(true)
    }
  }, [activated, tried, connect, previouslyConnected])

  useEffect(() => {
    const previousChain = previouslyConnected[0]?.chains ?? null
    const isConnected = connectedWallets.length > 0
    // switch chains
    if (isConnected && previousChain && connectedChain && previousChain !== connectedChain.id) {
      chainChanged(connectedChain.id) 
    }

    // new wallet connected
    if (isConnected && connectedChain && balance && !activated){
      updateStorage(connectedChain.id, connectedWallets, 'init')
    }

    // disconnect
    if (!isConnected && previouslyConnected[0] && tried){
      const isWalletConnect = previouslyConnected[0].label[0] === 'WalletConnect'
      StoreOnboardState(connectedWallets, '0x1')
      setActivated(false)
      if (isWalletConnect) {
        localStorage.removeItem('walletconnect')
        window.location.reload() // temporarily necessary, as there is a irrecoverable error/bug when not reloading
      }
    }
  }, [connectedWallets, tried]) 

  return {tried, activated}
}
