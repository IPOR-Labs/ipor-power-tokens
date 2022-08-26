import React, { useState } from "react";
import { newContextComponents } from "@drizzle/react-components";
import { Button } from "react-bootstrap";

const { ContractData, ContractForm } = newContextComponents;

export default ({ drizzle, drizzleState }) => {
    const [assets, setAssets] = useState([""]);
    const [amounts, setAmounts] = useState(["0"]);

    return (
        <div>
            <br />
            <h3>
                Ipor Token <small>{drizzle.contracts.IporToken.address}</small>
            </h3>
            {assets}
            <br />
            <div className="row">
                <table className="table" align="center">
                    <tr>
                        <td>
                            <strong>My Balance</strong>
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
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="IporToken"
                                method="allowance"
                                methodArgs={[
                                    drizzleState.accounts[0],
                                    drizzle.contracts.PwIporToken.address,
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
                            <strong>Set allowances</strong>
                        </td>
                        <td>
                            <ContractForm drizzle={drizzle} contract="IporToken" method="approve" />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Transfer TOKENS to</strong>
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
                Power Ipor <small>{drizzle.contracts.PwIporToken.address}</small>
            </h3>
            <br />
            <br />
            <div className="row">
                <table className="table" align="center">
                    <tr>
                        <td>
                            <strong>Total Supply(Base Tokens)</strong>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PwIporToken"
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
                    </tr>{" "}
                    <tr>
                        <td>
                            <strong>My Balance</strong>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PwIporToken"
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
                            <strong>My delegated balance</strong>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PwIporToken"
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
                            <strong>Exchange Rate</strong>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PwIporToken"
                                method="exchangeRate"
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
                            <strong>Withdrawal fee</strong>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PwIporToken"
                                method="withdrawalFee"
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
                            <strong>Set withdrawal fee</strong>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PwIporToken"
                                method="setWithdrawalFee"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Stake</strong>
                            <br />
                            <small>Stake iporToken into PwIporToken contract</small>
                        </td>
                        <td>
                            <ContractForm drizzle={drizzle} contract="PwIporToken" method="stake" />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Unstake</strong>
                            <br />
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PwIporToken"
                                method="unstake"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Set LiquidityRewards address</strong>
                            <br />
                            <small>
                                LiquidityRewards address:{" "}
                                {drizzle.contracts.LiquidityRewards.address}
                            </small>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PwIporToken"
                                method="setLiquidityRewardsAddress"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Delegate Power Ipor to LiquidityRewards</strong>
                        </td>
                        <td>
                            <tr style={{ border: "none" }}>
                                <td>
                                    <label htmlFor="Assets"> Assets: </label>
                                </td>
                                <td>
                                    <input
                                        id="Assets"
                                        value={assets.join(",")}
                                        onChange={(e) => setAssets(e.target.value.split(","))}
                                    />
                                </td>
                            </tr>
                            <tr style={{ border: "none" }}>
                                <td>
                                    <label> Amounts: </label>
                                </td>
                                <td>
                                    <input
                                        id="Amounts"
                                        value={amounts.map((e) => e.toString()).join(",")}
                                        onChange={(e) =>
                                            setAmounts(
                                                e.target.value.split(",")
                                                // .map((a) => (a != "" ? BigNumber.from(a) : ""))
                                            )
                                        }
                                    />
                                </td>
                            </tr>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PwIporToken"
                                method="delegateToRewards"
                                render={({ handleSubmit, inputs, state, handleInputChange }) => {
                                    state["assets"] = assets;
                                    state["amounts"] = amounts;
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
                                contract="PwIporToken"
                                method="activeCoolDown"
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
                            <strong>Set cool down</strong>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PwIporToken"
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
                                contract="PwIporToken"
                                method="cancelCoolDown"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Redeem cool down</strong>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PwIporToken"
                                method="redeem"
                            />
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    );
};
