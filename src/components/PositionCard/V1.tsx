import { Token, TokenAmount, WETH } from '@sushiswap/sdk'
import React, { useContext } from 'react'
import { Link, RouteComponentProps, withRouter } from 'react-router-dom'
import { Text } from 'rebass'
import { useTheme } from 'styled-components'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { ButtonSecondary } from '../ButtonLegacy'
import { AutoColumn } from '../Column'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween, RowFixed } from '../Row'
import { FixedHeightRow, HoverCard } from './index'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'

interface PositionCardProps extends RouteComponentProps<{}> {
    token: Token
    V1LiquidityBalance: TokenAmount
}

function V1PositionCard({ token, V1LiquidityBalance }: PositionCardProps) {
    const { i18n } = useLingui()
    const theme = useTheme()

    const { chainId } = useActiveWeb3React()

    return (
        <HoverCard>
            <AutoColumn gap="12px">
                <FixedHeightRow>
                    <RowFixed>
                        <DoubleCurrencyLogo currency0={token} margin={true} size={20} />
                        <Text fontWeight={500} fontSize={20} style={{ marginLeft: '' }}>
                            {`${chainId && token.equals(WETH[chainId]) ? 'WETH' : token.symbol}/ETH`}
                        </Text>
                        <Text
                            fontSize={12}
                            fontWeight={500}
                            ml="0.5rem"
                            px="0.75rem"
                            py="0.25rem"
                            style={{ borderRadius: '1rem' }}
                            backgroundColor={theme && theme.yellow1}
                            color={'black'}
                        >
                            V1
                        </Text>
                    </RowFixed>
                </FixedHeightRow>

                <AutoColumn gap="8px">
                    <RowBetween marginTop="10px">
                        <ButtonSecondary width="68%" as={Link} to={`/migrate/v1/${V1LiquidityBalance.token.address}`}>
                            {i18n._(t`Migrate`)}
                        </ButtonSecondary>

                        <ButtonSecondary
                            style={{ backgroundColor: 'transparent' }}
                            width="28%"
                            as={Link}
                            to={`/remove/v1/${V1LiquidityBalance.token.address}`}
                        >
                            {i18n._(t`Remove`)}
                        </ButtonSecondary>
                    </RowBetween>
                </AutoColumn>
            </AutoColumn>
        </HoverCard>
    )
}

export default withRouter(V1PositionCard)