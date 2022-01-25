import { darken } from 'polished'
import React, { useContext, useRef, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'

enum SlippageError {
    InvalidInput = 'InvalidInput',
    RiskyLow = 'RiskyLow',
    RiskyHigh = 'RiskyHigh'
}

enum DeadlineError {
    InvalidInput = 'InvalidInput'
}

const FancyButton = styled.button`
    color: ${({ theme }) => theme.text1};
    align-items: center;
    height: 2rem;
    border-radius: 5px;
    font-size: 1rem;
    width: auto;
    min-width: 3.5rem;
    border: 1px solid ${({ theme }) => theme.bg3};
    outline: none;
    background: ${({ theme }) => theme.bg1};
`

const Option = styled(FancyButton) <{ active: boolean }>`
    margin-right: 8px;
    :hover {
        cursor: pointer;
    }
    background-color: ${({ active, theme }) => (active ? theme.color.text2 : 'transparent')};
    color: ${({ active, theme }) => (active ? theme.color.main : theme.color.text2)};
    border-color: ${({ theme }) => theme.color.text2};
`

const Input = styled.input`
    background: ${({ theme }) => theme.bg1};
    font-size: 16px;
    width: auto;
    outline: none;
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
        -webkit-appearance: none;
    }
    color: ${({ theme, color }) => (color === 'red' ? theme.red1 : theme.text1)};
    text-align: right;
`

const OptionCustom = styled(FancyButton) <{ active?: boolean; warning?: boolean }>`
    height: 2rem;
    position: relative;
    padding: 0 0.75rem;
    flex: 1;
    border: 1px solid ${({ theme }) => theme.color.text5};

    input {
        width: 100%;
        height: 100%;
        border: 0px;
        border-radius: 2rem;
    }
`

const SlippageEmojiContainer = styled.span`
    color: #f3841e;
    ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;  
  `}
`

export interface SlippageTabsProps {
    rawSlippage: number
    setRawSlippage: (rawSlippage: number) => void
    deadline: number
    setDeadline: (deadline: number) => void
}

export default function SlippageTabs({ rawSlippage, setRawSlippage, deadline, setDeadline }: SlippageTabsProps) {
    const { i18n } = useLingui()
    const theme = useTheme()

    const inputRef = useRef<HTMLInputElement>()

    const [slippageInput, setSlippageInput] = useState('')
    const [deadlineInput, setDeadlineInput] = useState('')

    const slippageInputIsValid =
        slippageInput === '' || (rawSlippage / 100).toFixed(2) === Number.parseFloat(slippageInput).toFixed(2)
    const deadlineInputIsValid = deadlineInput === '' || (deadline / 60).toString() === deadlineInput

    let slippageError: SlippageError | undefined
    if (slippageInput !== '' && !slippageInputIsValid) {
        slippageError = SlippageError.InvalidInput
    } else if (slippageInputIsValid && rawSlippage < 50) {
        slippageError = SlippageError.RiskyLow
    } else if (slippageInputIsValid && rawSlippage > 500) {
        slippageError = SlippageError.RiskyHigh
    } else {
        slippageError = undefined
    }

    let deadlineError: DeadlineError | undefined
    if (deadlineInput !== '' && !deadlineInputIsValid) {
        deadlineError = DeadlineError.InvalidInput
    } else {
        deadlineError = undefined
    }

    function parseCustomSlippage(value: string) {
        setSlippageInput(value)

        try {
            const valueAsIntFromRoundedFloat = Number.parseInt((Number.parseFloat(value) * 100).toString())
            if (!Number.isNaN(valueAsIntFromRoundedFloat) && valueAsIntFromRoundedFloat < 5000) {
                setRawSlippage(valueAsIntFromRoundedFloat)
            }
        } catch { }
    }

    function parseCustomDeadline(value: string) {
        setDeadlineInput(value)

        try {
            const valueAsInt: number = Number.parseInt(value) * 60
            if (!Number.isNaN(valueAsInt) && valueAsInt > 0) {
                setDeadline(valueAsInt)
            }
        } catch { }
    }

    return (
        <AutoColumn gap="md">
            <AutoColumn gap="sm">
                <RowFixed>
                    <p className="sub-title">{i18n._(t`Slippage tolerance`)}</p>
                    <QuestionHelper
                        text={i18n._(
                            t`Your transaction will revert if the price changes unfavorably by more than this percentage.`
                        )}
                    />
                </RowFixed>
                <RowBetween>
                    <Option
                        onClick={() => {
                            setSlippageInput('')
                            setRawSlippage(10)
                        }}
                        active={rawSlippage === 10}
                    >
                        0.1%
                    </Option>
                    <Option
                        onClick={() => {
                            setSlippageInput('')
                            setRawSlippage(50)
                        }}
                        active={rawSlippage === 50}
                    >
                        0.5%
                    </Option>
                    <Option
                        onClick={() => {
                            setSlippageInput('')
                            setRawSlippage(100)
                        }}
                        active={rawSlippage === 100}
                    >
                        1%
                    </Option>
                    <div className="flex items-center space-x-2">
                        <span className="sm:hidden">Custom</span>
                        <OptionCustom
                            active={![10, 50, 100].includes(rawSlippage)}
                            warning={!slippageInputIsValid}
                            tabIndex={-1}
                        >
                            <RowBetween>
                                {!!slippageInput &&
                                    (slippageError === SlippageError.RiskyLow ||
                                        slippageError === SlippageError.RiskyHigh) ? (
                                    <SlippageEmojiContainer>
                                        <span role="img" aria-label="warning">
                                            ⚠️
                                        </span>
                                    </SlippageEmojiContainer>
                                ) : null}
                                {/* https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451 */}
                                <Input
                                    ref={inputRef as any}
                                    placeholder={(rawSlippage / 100).toFixed(2)}
                                    value={slippageInput}
                                    onBlur={() => {
                                        parseCustomSlippage((rawSlippage / 100).toFixed(2))
                                    }}
                                    onChange={e => parseCustomSlippage(e.target.value)}
                                    color={!slippageInputIsValid ? 'red' : ''}
                                />
                                %
                            </RowBetween>
                        </OptionCustom>
                    </div>
                </RowBetween>
                {!!slippageError && (
                    <RowBetween
                        style={{
                            fontSize: '14px',
                            paddingTop: '7px',
                            color: slippageError === SlippageError.InvalidInput ? 'red' : '#F3841E'
                        }}
                    >
                        {slippageError === SlippageError.InvalidInput
                            ? i18n._(t`Enter a valid slippage percentage`)
                            : slippageError === SlippageError.RiskyLow
                                ? i18n._(t`Your transaction may fail`)
                                : i18n._(t`Your transaction may be frontrun`)}
                    </RowBetween>
                )}
            </AutoColumn>

            <AutoColumn gap="sm">
                <RowFixed>
                    <p className="sub-title">{i18n._(t`Transaction deadline`)}</p>
                    <QuestionHelper
                        text={i18n._(t`Your transaction will revert if it is pending for more than this time.`)}
                    />
                </RowFixed>
                <RowFixed>
                    <OptionCustom style={{ width: '80px' }} tabIndex={-1}>
                        <Input
                            color={!!deadlineError ? 'red' : undefined}
                            onBlur={() => {
                                parseCustomDeadline((deadline / 60).toString())
                            }}
                            placeholder={(deadline / 60).toString()}
                            value={deadlineInput}
                            onChange={e => parseCustomDeadline(e.target.value)}
                        />
                    </OptionCustom>
                    <TYPE.body style={{ paddingLeft: '8px' }} fontSize={14}>
                        {i18n._(t`minutes`)}
                    </TYPE.body>
                </RowFixed>
            </AutoColumn>
        </AutoColumn>
    )
}