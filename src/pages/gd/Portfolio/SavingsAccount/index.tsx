import React, {useEffect, useState} from 'react'
import { ethers } from 'ethers'
import { SavingsSDK } from '@gooddollar/web3sdk-v2'
import { SavingsCard } from './SavingsCard'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { PortfolioTitleSC } from '../styled'

export const SavingsAccount = (
  { account, network, chainId}:
  { account:string | null | undefined, network:string, chainId: number}): JSX.Element => {
  const [hasBalance, setHasBalance] = useState<boolean | undefined>(true)
  const { i18n } = useLingui()

  useEffect(() => {
    if (account){
      const sdk = new SavingsSDK(new ethers.providers.JsonRpcProvider("https://rpc.fuse.io"), 'fuse')

      sdk.hasBalance(account).then((res) => {
        setHasBalance(res)
      })
    }
  }, [account, setHasBalance])

  return (
    <>
      <PortfolioTitleSC className="mb-3 md:pl-2 mt-4">{i18n._(`Savings`)}</PortfolioTitleSC>
      { account && (
        <SavingsCard account={account} network={network} hasBalance={hasBalance} chainId={chainId}/>
      )}
    </>
  )
}