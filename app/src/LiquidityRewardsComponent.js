import React from "react";
import { newContextComponents } from "@drizzle/react-components";

const { ContractData, ContractForm } = newContextComponents;

export default ({ drizzle, drizzleState }) => (
    <div>
        <br />
        <h3>Liquidity Rewards {drizzle.contracts.LiquidityRewards.address} </h3>
        <br />
        <div className="row">
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
                    <td>
                        <strong>Global params</strong>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="LiquidityRewards"
                            method="getGlobalParams"
                            methodArgs={[drizzle.contracts.IpTokenUsdt.address]}
                            render={(value) => {
                                return (
                                    <table>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Aggregate power up</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[0] / 1000000000000000000}
                                                <br />
                                                <small>{value[0]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Accrued rewards</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[1] / 1000000000000000000}
                                                <br />
                                                <small>{value[1]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Composite multiplier</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[2] / 1000000000000000000}
                                                <br />
                                                <small>{value[2]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Last rebalancing block number</td>
                                            <td style={{ "padding-left": "1rem" }}>{value[3]}</td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Block rewords</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[4] / 100000000}
                                                <br />
                                                <small>{value[4]}</small>
                                            </td>
                                        </tr>
                                    </table>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="LiquidityRewards"
                            method="getGlobalParams"
                            methodArgs={[drizzle.contracts.IpTokenUsdc.address]}
                            render={(value) => {
                                return (
                                    <table>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Aggregate power up</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[0] / 1000000000000000000}
                                                <br />
                                                <small>{value[0]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Accrued rewards</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[1] / 1000000000000000000}
                                                <br />
                                                <small>{value[1]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Composite multiplier</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[2] / 1000000000000000000}
                                                <br />
                                                <small>{value[2]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Last rebalancing block number</td>
                                            <td style={{ "padding-left": "1rem" }}>{value[3]}</td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Block rewords</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[4] / 100000000}
                                                <br />
                                                <small>{value[4]}</small>
                                            </td>
                                        </tr>
                                    </table>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="LiquidityRewards"
                            method="getGlobalParams"
                            methodArgs={[drizzle.contracts.IpTokenDai.address]}
                            render={(value) => {
                                return (
                                    <table>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Aggregate power up</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[0] / 1000000000000000000}
                                                <br />
                                                <small>{value[0]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Accrued rewards</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[1] / 1000000000000000000}
                                                <br />
                                                <small>{value[1]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Composite multiplier</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[2] / 1000000000000000000}
                                                <br />
                                                <small>{value[2]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Last rebalancing block number</td>
                                            <td style={{ "padding-left": "1rem" }}>{value[3]}</td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Block rewords</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[4] / 100000000}
                                                <br />
                                                <small>{value[4]}</small>
                                            </td>
                                        </tr>
                                    </table>
                                );
                            }}
                        />
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>My params</strong>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="LiquidityRewards"
                            method="getMyParams"
                            methodArgs={[drizzle.contracts.IpTokenUsdt.address]}
                            render={(value) => {
                                return (
                                    <table>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Power up</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[0] / 1000000000000000000}
                                                <br />
                                                <small>{value[0]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Composite multiplier</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[1] / 1000000000000000000}
                                                <br />
                                                <small>{value[1]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Staked ipTokens</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[2] / 1000000000000000000}
                                                <br />
                                                <small>{value[2]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Delegated powerToken</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[3] / 1000000000000000000}
                                                <br />
                                                <small>{value[3]}</small>
                                            </td>
                                        </tr>
                                    </table>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="LiquidityRewards"
                            method="getMyParams"
                            methodArgs={[drizzle.contracts.IpTokenUsdc.address]}
                            render={(value) => {
                                return (
                                    <table>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Power up</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[0] / 1000000000000000000}
                                                <br />
                                                <small>{value[0]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Composite multiplier</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[1] / 1000000000000000000}
                                                <br />
                                                <small>{value[1]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Staked ipTokens</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[2] / 1000000000000000000}
                                                <br />
                                                <small>{value[2]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Delegated powerToken</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[3] / 1000000000000000000}
                                                <br />
                                                <small>{value[3]}</small>
                                            </td>
                                        </tr>
                                    </table>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="LiquidityRewards"
                            method="getMyParams"
                            methodArgs={[drizzle.contracts.IpTokenDai.address]}
                            render={(value) => {
                                return (
                                    <table>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Power up</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[0] / 1000000000000000000}
                                                <br />
                                                <small>{value[0]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Composite multiplier</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[1] / 1000000000000000000}
                                                <br />
                                                <small>{value[1]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Staked ipTokens</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[2] / 1000000000000000000}
                                                <br />
                                                <small>{value[2]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Delegated powerToken</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[3] / 1000000000000000000}
                                                <br />
                                                <small>{value[3]}</small>
                                            </td>
                                        </tr>
                                    </table>
                                );
                            }}
                        />
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>My IpToken Balance</strong>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="CockpitDataProvider"
                            method="getMyIpTokenBalance"
                            methodArgs={[drizzle.contracts.DrizzleUsdt.address]}
                            render={(value) => (
                                <div>
                                    {value / 1000000000000000000}
                                    <br />
                                    <small>{value}</small>
                                </div>
                            )}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="CockpitDataProvider"
                            method="getMyIpTokenBalance"
                            methodArgs={[drizzle.contracts.DrizzleUsdc.address]}
                            render={(value) => (
                                <div>
                                    {value / 1000000000000000000}
                                    <br />
                                    <small>{value}</small>
                                </div>
                            )}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="CockpitDataProvider"
                            method="getMyIpTokenBalance"
                            methodArgs={[drizzle.contracts.DrizzleDai.address]}
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
                        <strong>My Stake IpToken Balance</strong>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="LiquidityRewards"
                            method="balanceOf"
                            methodArgs={[drizzle.contracts.IpTokenUsdt.address]}
                            render={(value) => (
                                <div>
                                    {value / 1000000000000000000}
                                    <br />
                                    <small>{value}</small>
                                </div>
                            )}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="LiquidityRewards"
                            method="balanceOf"
                            methodArgs={[drizzle.contracts.IpTokenUsdc.address]}
                            render={(value) => (
                                <div>
                                    {value / 1000000000000000000}
                                    <br />
                                    <small>{value}</small>
                                </div>
                            )}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="LiquidityRewards"
                            method="balanceOf"
                            methodArgs={[drizzle.contracts.IpTokenDai.address]}
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
                        <strong>My Delegated power token balance</strong>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="LiquidityRewards"
                            method="balanceOfDelegatedPwIpor"
                            methodArgs={[
                                drizzleState.accounts[0],
                                [drizzle.contracts.IpTokenUsdt.address],
                            ]}
                            render={(value) => {
                                console.error(value);
                                return (
                                    <div>
                                        {value[0][0]["amount"] / 1000000000000000000}
                                        <br />
                                        <small>{value[0][0]["amount"]}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="LiquidityRewards"
                            method="balanceOfDelegatedPwIpor"
                            methodArgs={[
                                drizzleState.accounts[0],
                                [drizzle.contracts.IpTokenUsdc.address],
                            ]}
                            render={(value) => {
                                console.error(value);
                                return (
                                    <div>
                                        {value[0][0]["amount"] / 1000000000000000000}
                                        <br />
                                        <small>{value[0][0]["amount"]}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="LiquidityRewards"
                            method="balanceOfDelegatedPwIpor"
                            methodArgs={[
                                drizzleState.accounts[0],
                                [drizzle.contracts.IpTokenDai.address],
                            ]}
                            render={(value) => {
                                console.error(value);
                                return (
                                    <div>
                                        {value[0][0]["amount"] / 1000000000000000000}
                                        <br />
                                        <small>{value[0][0]["amount"]}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>Rewards per block</strong>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="LiquidityRewards"
                            method="getRewardsPerBlock"
                            methodArgs={[drizzle.contracts.IpTokenUsdt.address]}
                            render={(value) => {
                                console.error(value);
                                return (
                                    <div>
                                        {value / 100000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="LiquidityRewards"
                            method="getRewardsPerBlock"
                            methodArgs={[drizzle.contracts.IpTokenUsdc.address]}
                            render={(value) => {
                                console.error(value);
                                return (
                                    <div>
                                        {value / 100000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="LiquidityRewards"
                            method="getRewardsPerBlock"
                            methodArgs={[drizzle.contracts.IpTokenDai.address]}
                            render={(value) => {
                                console.error(value);
                                return (
                                    <div>
                                        {value / 100000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>Set rewards per block</strong> <br />
                        <small>1 = 100 000 000</small>
                    </td>
                    <td colspan="2">
                        <ContractForm
                            drizzle={drizzle}
                            contract="LiquidityRewards"
                            method="setRewardsPerBlock"
                        />
                    </td>
                </tr>
            </table>
            <table className="table" align="center">
                <tr>
                    <th scope="col">My allowances</th>
                    <th scope="col">ipUSDT</th>
                    <th scope="col">ipUSDC</th>
                    <th scope="col">ipDAI</th>
                </tr>
                <tr>
                    <td>
                        <strong> LiquidityRewards</strong>
                        <br />
                        For provide liquidity
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="IpTokenUsdt"
                            method="allowance"
                            methodArgs={[
                                drizzleState.accounts[0],
                                drizzle.contracts.LiquidityRewards.address,
                            ]}
                            render={(value) => (
                                <div>
                                    {value / 1000000}
                                    <br />
                                    <small>{value}</small>
                                </div>
                            )}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="IpTokenUsdc"
                            method="allowance"
                            methodArgs={[
                                drizzleState.accounts[0],
                                drizzle.contracts.LiquidityRewards.address,
                            ]}
                            render={(value) => (
                                <div>
                                    {value / 1000000}
                                    <br />
                                    <small>{value}</small>
                                </div>
                            )}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="IpTokenDai"
                            method="allowance"
                            methodArgs={[
                                drizzleState.accounts[0],
                                drizzle.contracts.LiquidityRewards.address,
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
                    <td></td>
                    <td>
                        <ContractForm drizzle={drizzle} contract="IpTokenUsdt" method="approve" />
                    </td>
                    <td>
                        <ContractForm drizzle={drizzle} contract="IpTokenUsdc" method="approve" />
                    </td>
                    <td>
                        <ContractForm drizzle={drizzle} contract="IpTokenDai" method="approve" />
                    </td>
                </tr>
            </table>
            <table className="table" align="center">
                <tr>
                    <th scope="col">Parameter</th>
                    <th scope="col">action</th>
                </tr>

                <tr>
                    <td>
                        <strong>Stake</strong>
                        <br />
                        <small>Stake ipToken into LiquidityRewards contract</small>
                    </td>
                    <td>
                        <ContractForm
                            drizzle={drizzle}
                            contract="LiquidityRewards"
                            method="stake"
                        />
                    </td>
                </tr>
            </table>
        </div>
    </div>
);
