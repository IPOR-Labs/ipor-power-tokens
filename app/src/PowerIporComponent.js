import React, { useState } from "react";
import { newContextComponents } from "@drizzle/react-components";
import { BigNumber } from "ethers";

const { ContractData, ContractForm } = newContextComponents;

export default ({ drizzle, drizzleState }) => {
    const [ipTokens, setIpTokens] = useState([""]);
    const [pwIporAmounts, setPwIporAmounts] = useState(["0"]);

    return (
        <div>
            <br />

            <h3>
                Ipor Token <small>{drizzle.contracts.IporToken.address}</small>
            </h3>
            {ipTokens}
            <br />
            <div className="row">
                <table className="table" align="center">
                    <tr>
                        <td>
                            <strong>My Balance of Ipor Token</strong>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="IporToken"
                                method="balanceOf"
                                methodArgs={[drizzleState.accounts[0]]}
                                render={(value) => (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>My allowances</strong>
                            <br />
                            <small>Allowance to pwIpor</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="IporToken"
                                method="allowance"
                                methodArgs={[
                                    drizzleState.accounts[0],
                                    drizzle.contracts.PowerIpor.address,
                                ]}
                                render={(value) => (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Set allowances</strong> <br />
                            <small>PowerToken: {drizzle.contracts.PowerIpor.address}</small>
                        </td>
                        <td>
                            <ContractForm drizzle={drizzle} contract="IporToken" method="approve" />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Transfer Ipor Tokens to</strong>
                            <br />
                            <small>
                                for setup need to transfer 1000000000000000000000 ipor tokens to{" "}
                                <br /> John {drizzle.contracts.John.address}
                            </small>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="IporToken"
                                method="transfer"
                            />
                        </td>
                    </tr>
                </table>
                <br />
            </div>
            <br />
            <br />
            <h3>
                Power Ipor <small>{drizzle.contracts.PowerIpor.address}</small>
            </h3>
            <br />
            <br />
            <div className="row">
                <table className="table" align="center">
                    <tr>
                        <td>
                            <strong>Set John address</strong>
                            <br />
                            <small>John address: {drizzle.contracts.John.address}</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PowerIpor"
                                method="getJohn"
                                render={(value) =>
                                    value !== "0x0000000000000000000000000000000000000000" ? (
                                        value
                                    ) : (
                                        <b>Not setup</b>
                                    )
                                }
                            />
                            <br />
                            <ContractForm drizzle={drizzle} contract="PowerIpor" method="setJohn" />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Total Supply</strong> <br />
                            <small>(base tokens)</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PowerIpor"
                                method="totalSupplyBase"
                                render={(value) => (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Total Supply</strong> <br />
                            <small>(power tokens)</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PowerIpor"
                                method="totalSupply"
                                render={(value) => (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>My Balance</strong> <br />
                            <small>(power tokens)</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PowerIpor"
                                method="balanceOf"
                                methodArgs={[drizzleState.accounts[0]]}
                                render={(value) => (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Delegated balance</strong> <br />
                            <small>power tokens delegated to liquidity rewards</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PowerIpor"
                                method="delegatedBalanceOf"
                                methodArgs={[drizzleState.accounts[0]]}
                                render={(value) => (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Exchange Rate</strong> <br />
                            <small>between base token and pwIpor token</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PowerIpor"
                                method="calculateExchangeRate"
                                render={(value) => (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Withdrawal fee</strong> <br />
                            <small>this fee is charged during unstake</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PowerIpor"
                                method="getUnstakeWithoutCooldownFee"
                                render={(value) => (
                                    <div>
                                        {value / 10000000000000000} %
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Set withdrawal fee</strong> <br />
                            <small>represented in 18 decimals</small>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PowerIpor"
                                method="setWithdrawFee"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Stake</strong>
                            <br />
                            <small>
                                Stake iporToken into PowerIpor contract, <br />
                                represented in 18 decimals
                            </small>
                        </td>
                        <td>
                            <ContractForm drizzle={drizzle} contract="PowerIpor" method="stake" />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Unstake</strong>
                            <br />
                            <small>
                                Unstake pwIpor into PowerIpor contract, <br />
                                represented in 18 decimals
                            </small>
                        </td>
                        <td>
                            <ContractForm drizzle={drizzle} contract="PowerIpor" method="unstake" />
                        </td>
                    </tr>
                    <tr style={{ padding: "1em" }}>
                        <td>
                            <strong>Delegate pwIpor to John</strong> <br />
                            Assets: <br />
                            <small>
                                ipUsdt: {drizzle.contracts.IpTokenUsdt.address}, <br />
                                ipUsdc: {drizzle.contracts.IpTokenUsdc.address}, <br />
                                ipDai: {drizzle.contracts.IpTokenDai.address}, <br />
                                amounts represented in 18 decimals, <br />
                                example for two assets: <br />
                                assets:
                                {drizzle.contracts.IpTokenUsdt.address},
                                {drizzle.contracts.IpTokenUsdc.address}
                                <br />
                                amounts: 10000000000000000000,20000000000000000000
                            </small>
                        </td>
                        <td>
                            <tr style={{ border: "none" }}>
                                <td>
                                    <label htmlFor="IpTokens"> IpTokens: </label>
                                </td>
                                <td style={{ border: "none", padding: "1em" }}>
                                    <input
                                        id="IpTokens"
                                        value={ipTokens.join(",")}
                                        onChange={(e) => setIpTokens(e.target.value.split(","))}
                                    />
                                </td>
                            </tr>
                            <tr style={{ border: "none" }}>
                                <td>
                                    <label> Amounts: </label>
                                </td>
                                <td style={{ border: "none", padding: "1em" }}>
                                    <input
                                        id="amounts"
                                        value={pwIporAmounts.map((e) => e.toString()).join(",")}
                                        onChange={(e) => {
                                            setPwIporAmounts(
                                                e.target.value
                                                    .split(",")
                                                    .map((a) => (a != "" ? BigNumber.from(a) : ""))
                                            );
                                        }}
                                    />
                                </td>
                            </tr>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PowerIpor"
                                method="delegateToJohn"
                                render={({ handleSubmit, inputs, state, handleInputChange }) => {
                                    state["ipTokens"] = ipTokens;
                                    state["pwIporAmounts"] = pwIporAmounts;
                                    return (
                                        <div>
                                            <form
                                                className="pure-form pure-form-stacked"
                                                onSubmit={handleSubmit}
                                            >
                                                <button
                                                    key="submit"
                                                    className="pure-button"
                                                    type="button"
                                                    onClick={handleSubmit}
                                                >
                                                    Submit
                                                </button>
                                            </form>
                                        </div>
                                    );
                                }}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Withdraw pwIpor from John</strong> <br />
                            Assets: <br />
                            <small>
                                ipUsdt: {drizzle.contracts.IpTokenUsdt.address}, delegated balance{" "}
                                <br />
                                <ContractData
                                    drizzle={drizzle}
                                    drizzleState={drizzleState}
                                    contract="John"
                                    method="getAccountIndicators"
                                    methodArgs={[drizzle.contracts.IpTokenUsdt.address]}
                                    render={(value) => {
                                        return (
                                            <span>
                                                {value[3] / 1000000000000000000} - {value[3]}{" "}
                                            </span>
                                        );
                                    }}
                                />
                                <br />
                                ipUsdc: {drizzle.contracts.IpTokenUsdc.address}, delegated balance{" "}
                                <br />
                                <ContractData
                                    drizzle={drizzle}
                                    drizzleState={drizzleState}
                                    contract="John"
                                    method="getAccountIndicators"
                                    methodArgs={[drizzle.contracts.IpTokenUsdc.address]}
                                    render={(value) => {
                                        return (
                                            <span>
                                                {value[3] / 1000000000000000000} - {value[3]}{" "}
                                            </span>
                                        );
                                    }}
                                />
                                <br />
                                ipDai: {drizzle.contracts.IpTokenDai.address}, delegated balance{" "}
                                <br />
                                <ContractData
                                    drizzle={drizzle}
                                    drizzleState={drizzleState}
                                    contract="John"
                                    method="getAccountIndicators"
                                    methodArgs={[drizzle.contracts.IpTokenDai.address]}
                                    render={(value) => {
                                        return (
                                            <span>
                                                {value[3] / 1000000000000000000} - {value[3]}{" "}
                                            </span>
                                        );
                                    }}
                                />
                                <br />
                                amounts represented in 18 decimals
                            </small>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PowerIpor"
                                method="undelegateFromJohn"
                            />
                        </td>
                    </tr>
                </table>
            </div>

            <br />
            <br />
            <h3>
                <small>Cool down</small>
            </h3>
            <br />
            <br />
            <div className="row">
                <table className="table" align="center">
                    <tr>
                        <td>
                            <strong>Active Cool down</strong>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PowerIpor"
                                method="getActiveCoolDown"
                                render={(value) => (
                                    <div>
                                        <table>
                                            <tr style={{ border: "none", "padding-left": "1rem" }}>
                                                <td>when cool down finish</td>
                                                <td style={{ "padding-left": "1rem" }}>
                                                    {value[0] == 0
                                                        ? "-"
                                                        : new Date(
                                                              value[0] * 1000
                                                          ).toLocaleDateString() +
                                                          " " +
                                                          new Date(
                                                              value[0] * 1000
                                                          ).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                            <tr style={{ border: "none", "padding-left": "1rem" }}>
                                                <td>Amount</td>
                                                <td style={{ "padding-left": "1rem" }}>
                                                    {value[1] / 1000000000000000000}
                                                    <br />
                                                    <small>{value[1]}</small>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Set cool down</strong> <br />
                            <small>
                                Amount of pwIpor tokens to cool down, <brr />
                                represented in 18 decimals
                            </small>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PowerIpor"
                                method="coolDown"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Cancel cool down</strong>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PowerIpor"
                                method="cancelCoolDown"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Redeem cool down</strong>
                            <br />
                            <small>Could be execute when cool down finish</small>
                        </td>
                        <td>
                            <ContractForm drizzle={drizzle} contract="PowerIpor" method="redeem" />
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    );
};
