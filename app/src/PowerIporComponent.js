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

            <h4>
                Ipor Token <small>{drizzle.contracts.IporToken.address}</small>
            </h4>
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
                            <small>Allowance to Power Ipor Token (pwIpor)</small>
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
            <h4>
                Power Ipor <small>{drizzle.contracts.PowerIpor.address}</small>
            </h4>
            <br />
            <div className="row">
                <table className="table" align="center">
                    <tr>
                        <td>
                            <strong>Total Supply - Base Tokens</strong> <br />
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
                            <strong>Total Supply - Power Ipor Tokens</strong> <br />
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
                            <strong>My Balance - Power Ipor Tokens</strong>
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
                            <small>Power Ipor Tokens delegated to John</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PowerIpor"
                                method="delegatedToJohnBalanceOf"
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
                            <strong>Internal Exchange Rate</strong> <br />
                            <small>between base token and Power Ipor Token (pwIpor)</small>
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
                            <strong>Stake</strong>
                            <br />
                            <small>
                                Stake IPOR Token into PowerIpor contract, <br />
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
                                Unstake Power Ipor Token (pwIpor) from PowerIpor contract, <br />
                                represented in 18 decimals
                            </small>
                        </td>
                        <td>
                            <ContractForm drizzle={drizzle} contract="PowerIpor" method="unstake" />
                        </td>
                    </tr>
                </table>
                <hr />
                <h4>Power Ipor Smart Contract Configuration</h4>
                <table className="table" align="center">
                    <tr>
                        <td>
                            <strong>Set Pause Manager address</strong>
                        </td>
                        <td>
                            Current Pause Manager:{" "}
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PowerIpor"
                                method="getPauseManager"
                            />
                            <br />
                            <ContractForm
                                drizzle={drizzle}
                                contract="PowerIpor"
                                method="setPauseManager"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Set John address</strong>
                            <br />
                            <small>John address: {drizzle.contracts.John.address}</small>
                        </td>
                        <td>
                            Current John address:{" "}
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PowerIpor"
                                method="getJohn"
                            />
                            <br />
                            <ContractForm drizzle={drizzle} contract="PowerIpor" method="setJohn" />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Unstake without cool down fee</strong> <br />
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
                            <strong>Set unstake without cool down fee</strong> <br />
                            <small>represented in 18 decimals</small>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PowerIpor"
                                method="setUnstakeWithoutCooldownFee"
                            />
                        </td>
                    </tr>
                </table>
                <hr />
                <h4>Delegate / undelegate Power Ipor Tokens</h4>

                <table className="table" align="center">
                    <tr>
                        <th scope="col"></th>
                        <th scope="col">
                            ipUSDT
                            <br />
                            {drizzle.contracts.IpTokenUsdt.address}
                        </th>
                        <th scope="col">
                            ipUSDC
                            <br />
                            {drizzle.contracts.IpTokenUsdc.address}
                        </th>
                        <th scope="col">
                            ipDAI
                            <br />
                            {drizzle.contracts.IpTokenDai.address}
                        </th>
                    </tr>
                    <tr>
                        <td>Delegated balance</td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="John"
                                method="getAccountIndicators"
                                methodArgs={[
                                    drizzleState.accounts[0],
                                    drizzle.contracts.IpTokenUsdt.address,
                                ]}
                                render={(value) => {
                                    return (
                                        <span>
                                            {value.delegatedPwIporBalance / 1000000000000000000}
                                            <br />
                                            {value.delegatedPwIporBalance}
                                        </span>
                                    );
                                }}
                            />
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="John"
                                method="getAccountIndicators"
                                methodArgs={[
                                    drizzleState.accounts[0],
                                    drizzle.contracts.IpTokenUsdc.address,
                                ]}
                                render={(value) => {
                                    return (
                                        <span>
                                            {value.delegatedPwIporBalance / 1000000000000000000}
                                            <br />
                                            {value.delegatedPwIporBalance}
                                        </span>
                                    );
                                }}
                            />
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="John"
                                method="getAccountIndicators"
                                methodArgs={[
                                    drizzleState.accounts[0],
                                    drizzle.contracts.IpTokenDai.address,
                                ]}
                                render={(value) => {
                                    return (
                                        <span>
                                            {value.delegatedPwIporBalance / 1000000000000000000}
                                            <br />
                                            {value.delegatedPwIporBalance}
                                        </span>
                                    );
                                }}
                            />
                        </td>
                    </tr>
                </table>
                <table className="table" align="center">
                    <tr style={{ padding: "1em" }}>
                        <td>
                            <strong>Delegate Power Ipor Token (pwIpor) to John</strong> <br />
                            <small>
                                Amounts represented in 18 decimals. <br />
                            </small>
                            <div align="left">
                                <small>
                                    Example for two IP Tokens: <br />
                                    IpTokens: {drizzle.contracts.IpTokenUsdt.address},
                                    {drizzle.contracts.IpTokenUsdc.address}
                                    <br />
                                    Amounts: 10000000000000000000,20000000000000000000
                                </small>
                            </div>
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
                            <strong>Undelegate Power Ipor Token (pwIpor) from John</strong>
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
            <hr />
            <h4>Cool down</h4>

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
                                methodArgs={[drizzleState.accounts[0]]}
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
                                Amount of Power Ipor Tokens (pwIpor) to cool down, <brr />
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
