import hre, { upgrades } from "hardhat";
import { expect } from "chai";
import { Signer, BigNumber } from "ethers";




import {
    MockBaseMiltonSpreadModelDai,
    DaiMockedToken,
    UsdtMockedToken,
    UsdcMockedToken,
    IpToken,
} from "../../types";

import {
    USD_10_000_000,
    USD_1_000_000,
    TC_DEFAULT_EMA_18DEC,
    USD_10_000_6DEC,
    TOTAL_SUPPLY_6_DECIMALS,
    USER_SUPPLY_6_DECIMALS,
    N0__1_18DEC,
    TOTAL_SUPPLY_18_DECIMALS,
    USD_10_000_18DEC,
    USER_SUPPLY_10MLN_18DEC,
    LEVERAGE_18DEC,
    ZERO,
    N0__01_18DEC,
    N1__0_18DEC,
    YEAR_IN_SECONDS,
    LEG_PAY_FIXED,
    LEG_RECEIVE_FIXED,
} from "./Constants";

const { ethers } = hre;

// ########################################################################################################
//                                           General
// ########################################################################################################

type AssetsType = "DAI" | "USDC" | "USDT";

export type TestData = {
    executionTimestamp: BigNumber;
    tokenDai?: DaiMockedToken;
    tokenUsdt?: UsdtMockedToken;
    tokenUsdc?: UsdcMockedToken;
    ipTokenUsdt?: IpToken;
    ipTokenUsdc?: IpToken;
    ipTokenDai?: IpToken;
};

export type TestDataMining = {
    executionTimestamp: BigNumber;
    tokenDai?: DaiMockedToken;
    tokenUsdt?: UsdtMockedToken;
    tokenUsdc?: UsdcMockedToken;
    ipTokenUsdt?: IpToken;
    ipTokenUsdc?: IpToken;
    ipTokenDai?: IpToken;
};

export const prepareTestData = async (
    executionTimestamp: BigNumber,
    accounts: Signer[],
    assets: AssetsType[],
    emas: BigNumber[],
    miltonSpreadModel: MockBaseMiltonSpreadModelDai | MiltonSpreadModel | MockSpreadModel, //data
    miltonUsdcCase: MiltonUsdcCase,
    miltonUsdtCase: MiltonUsdtCase,
    miltonDaiCase: MiltonDaiCase,
    stanleyCaseNumber: MockStanleyCase,
    josephCaseUsdc: JosephUsdcMockCases,
    josephCaseUsdt: JosephUsdtMockCases,
    josephCaseDai: JosephDaiMockCases,
    iporOracleOption?: ItfIporOracle
): Promise<TestData> => {
    let tokenDai: DaiMockedToken | undefined;
    let tokenUsdt: UsdtMockedToken | undefined;
    let tokenUsdc: UsdcMockedToken | undefined;
    let ipTokenUsdt: IpToken | undefined;
    let ipTokenUsdc: IpToken | undefined;
    let ipTokenDai: IpToken | undefined;
    let miltonUsdt: MiltonUsdtMockCase | undefined;
    let miltonStorageUsdt: MiltonStorage | undefined;
    let josephUsdt: JosephUsdtMocks | undefined;
    let miltonUsdc: MiltonUsdcMockCase | undefined;
    let miltonStorageUsdc: MiltonStorage | undefined;
    let josephUsdc: JosephUsdcMocks | undefined;
    let miltonDai: MiltonDaiMockCase | undefined;
    let miltonStorageDai: MockMiltonStorage | MiltonStorage | undefined;
    let josephDai: JosephDaiMocks | undefined;
    let stanleyUsdt: MockStanley | undefined;
    let stanleyUsdc: MockStanley | undefined;
    let stanleyDai: MockStanley | undefined;

    const IpToken = await ethers.getContractFactory("IpToken");
    const UsdtMockedToken = await ethers.getContractFactory("UsdtMockedToken");
    const UsdcMockedToken = await ethers.getContractFactory("UsdcMockedToken");
    const DaiMockedToken = await ethers.getContractFactory("DaiMockedToken");
    const MiltonStorage = await ethers.getContractFactory("MiltonStorage");

    const assetsAddr: string[] = [];
    const lastUpdateTimestamps: BigNumber[] = [];
    const exponentialMovingAverages: BigNumber[] = [];
    const exponentialWeightedMovingVariances: BigNumber[] = [];

    for (let k = 0; k < assets.length; k++) {
        if (assets[k] === "USDT") {
            tokenUsdt = (await UsdtMockedToken.deploy(
                TOTAL_SUPPLY_6_DECIMALS,
                6
            )) as UsdtMockedToken;
            await tokenUsdt.deployed();
            assetsAddr.push(tokenUsdt.address);
            lastUpdateTimestamps.push(executionTimestamp);
            exponentialWeightedMovingVariances.push(ZERO);
        }
        if (assets[k] === "USDC") {
            tokenUsdc = (await UsdcMockedToken.deploy(
                TOTAL_SUPPLY_6_DECIMALS,
                6
            )) as UsdcMockedToken;
            await tokenUsdc.deployed();
            assetsAddr.push(tokenUsdc.address);
            lastUpdateTimestamps.push(executionTimestamp);
            exponentialWeightedMovingVariances.push(ZERO);
        }

        if (assets[k] === "DAI") {
            tokenDai = (await DaiMockedToken.deploy(
                TOTAL_SUPPLY_18_DECIMALS,
                18
            )) as DaiMockedToken;
            await tokenDai.deployed();
            assetsAddr.push(tokenDai.address);
            lastUpdateTimestamps.push(executionTimestamp);
            exponentialWeightedMovingVariances.push(BigNumber.from("0"));
        }

        if (emas[k]) {
            exponentialMovingAverages.push(emas[k]);
        } else {
            exponentialMovingAverages.push(TC_DEFAULT_EMA_18DEC);
        }
    }

    const iporOracle =
        iporOracleOption ||
        (await prepareIporOracle(
            accounts,
            assetsAddr,
            lastUpdateTimestamps,
            exponentialMovingAverages,
            exponentialWeightedMovingVariances
        ));

    if (tokenUsdt) {
        stanleyUsdt = await getMockStanleyCase(stanleyCaseNumber, tokenUsdt.address);
        ipTokenUsdt = (await IpToken.deploy("IP USDT", "ipUSDT", tokenUsdt.address)) as IpToken;

        miltonStorageUsdt = (await upgrades.deployProxy(MiltonStorage, [], {
            kind: "uups",
        })) as MiltonStorage;

        const MiltonUSDT = await ethers.getContractFactory(miltonUsdtCase);
        miltonUsdt = (await upgrades.deployProxy(
            MiltonUSDT,
            [
                false,
                tokenUsdt.address,
                iporOracle.address,
                miltonStorageUsdt.address,
                miltonSpreadModel.address,
                stanleyUsdt.address,
            ],
            {
                kind: "uups",
            }
        )) as MiltonUsdtMockCase;

        let JosephUsdt = await ethers.getContractFactory(josephCaseUsdt);
        josephUsdt = (await upgrades.deployProxy(
            JosephUsdt,
            [
                false,
                tokenUsdt.address,
                ipTokenUsdt.address,
                miltonUsdt.address,
                miltonStorageUsdt.address,
                stanleyUsdt.address,
            ],
            {
                kind: "uups",
            }
        )) as JosephUsdtMocks;

        await josephUsdt.setMaxLiquidityPoolBalance(USD_10_000_000);
        await josephUsdt.setMaxLpAccountContribution(USD_1_000_000);

        await miltonStorageUsdt.setJoseph(josephUsdt.address);
        await miltonStorageUsdt.setMilton(miltonUsdt.address);

        await ipTokenUsdt.setJoseph(josephUsdt.address);

        await miltonUsdt.setJoseph(josephUsdt.address);
        await miltonUsdt.setupMaxAllowanceForAsset(josephUsdt.address);
        await miltonUsdt.setupMaxAllowanceForAsset(stanleyUsdt.address);
    }

    if (tokenUsdc) {
        stanleyUsdc = await getMockStanleyCase(stanleyCaseNumber, tokenUsdc.address);

        ipTokenUsdc = (await IpToken.deploy("IP USDC", "ipUSDC", tokenUsdc.address)) as IpToken;

        miltonStorageUsdc = (await upgrades.deployProxy(MiltonStorage, [], {
            kind: "uups",
        })) as MiltonStorage;

        const MiltonUSDC = await ethers.getContractFactory(miltonUsdcCase);
        miltonUsdc = (await upgrades.deployProxy(
            MiltonUSDC,
            [
                false,
                tokenUsdc.address,
                iporOracle.address,
                miltonStorageUsdc.address,
                miltonSpreadModel.address,
                stanleyUsdc.address,
            ],
            {
                kind: "uups",
            }
        )) as MiltonUsdcMockCase;

        let JosephUsdc = await ethers.getContractFactory(josephCaseUsdc);
        josephUsdc = (await upgrades.deployProxy(
            JosephUsdc,
            [
                false,
                tokenUsdc.address,
                ipTokenUsdc.address,
                miltonUsdc.address,
                miltonStorageUsdc.address,
                stanleyUsdc.address,
            ],
            {
                kind: "uups",
            }
        )) as JosephUsdcMocks;

        await josephUsdc.setMaxLiquidityPoolBalance(USD_10_000_000);
        await josephUsdc.setMaxLpAccountContribution(USD_1_000_000);

        await miltonStorageUsdc.setJoseph(josephUsdc.address);
        await miltonStorageUsdc.setMilton(miltonUsdc.address);

        await ipTokenUsdc.setJoseph(josephUsdc.address);

        await miltonUsdc.setJoseph(josephUsdc.address);
        await miltonUsdc.setupMaxAllowanceForAsset(josephUsdc.address);
        await miltonUsdc.setupMaxAllowanceForAsset(stanleyUsdc.address);
    }

    if (tokenDai) {
        stanleyDai = await getMockStanleyCase(stanleyCaseNumber, tokenDai.address);

        ipTokenDai = (await IpToken.deploy("IP DAI", "ipDAI", tokenDai.address)) as IpToken;

        miltonStorageDai = (await upgrades.deployProxy(MiltonStorage, [], {
            kind: "uups",
        })) as MiltonStorage;

        const MiltonDAI = await ethers.getContractFactory(miltonDaiCase);
        miltonDai = (await upgrades.deployProxy(
            MiltonDAI,
            [
                false,
                tokenDai.address,
                iporOracle.address,
                miltonStorageDai.address,
                miltonSpreadModel.address,
                stanleyDai.address,
            ],
            {
                kind: "uups",
            }
        )) as MiltonDaiMockCase;

        let JosephDai = await ethers.getContractFactory(josephCaseDai);
        josephDai = (await upgrades.deployProxy(
            JosephDai,
            [
                false,
                tokenDai.address,
                ipTokenDai.address,
                miltonDai.address,
                miltonStorageDai.address,
                stanleyDai.address,
            ],
            {
                kind: "uups",
            }
        )) as JosephDaiMocks;

        await josephDai.setMaxLiquidityPoolBalance(USD_10_000_000);
        await josephDai.setMaxLpAccountContribution(USD_1_000_000);

        await miltonStorageDai.setJoseph(josephDai.address);
        await miltonStorageDai.setMilton(miltonDai.address);

        await ipTokenDai.setJoseph(josephDai.address);

        await miltonDai.setJoseph(josephDai.address);
        await miltonDai.setupMaxAllowanceForAsset(josephDai.address);
        await miltonDai.setupMaxAllowanceForAsset(stanleyDai.address);
    }

    return {
        executionTimestamp,
        tokenDai,
        tokenUsdt,
        tokenUsdc,
        ipTokenUsdt,
        ipTokenUsdc,
        ipTokenDai,
        iporOracle,
        miltonUsdt,
        miltonStorageUsdt,
        josephUsdt,
        miltonUsdc,
        miltonStorageUsdc,
        josephUsdc,
        miltonDai,
        miltonStorageDai,
        josephDai,
        stanleyUsdt,
        stanleyUsdc,
        stanleyDai,
    };
};

export const prepareTestDataForMining = async (
    executionTimestamp: BigNumber,
    accounts: Signer[],
    assets: AssetsType[]
): Promise<TestDataMining> => {
    let tokenDai: DaiMockedToken | undefined;
    let tokenUsdt: UsdtMockedToken | undefined;
    let tokenUsdc: UsdcMockedToken | undefined;
    let ipTokenUsdt: IpToken | undefined;
    let ipTokenUsdc: IpToken | undefined;
    let ipTokenDai: IpToken | undefined;
    let iporToken: IporToken | undefined;

    const IpToken = await ethers.getContractFactory("IpToken");
    const IporToken = await ethers.getContractFactory("IporToken");
    const UsdtMockedToken = await ethers.getContractFactory("UsdtMockedToken");
    const UsdcMockedToken = await ethers.getContractFactory("UsdcMockedToken");
    const DaiMockedToken = await ethers.getContractFactory("DaiMockedToken");

    const assetsAddr: string[] = [];
    const lastUpdateTimestamps: BigNumber[] = [];

    for (let k = 0; k < assets.length; k++) {
        if (assets[k] === "USDT") {
            tokenUsdt = (await UsdtMockedToken.deploy(
                TOTAL_SUPPLY_6_DECIMALS,
                6
            )) as UsdtMockedToken;
            await tokenUsdt.deployed();
            assetsAddr.push(tokenUsdt.address);
            lastUpdateTimestamps.push(executionTimestamp);
        }
        if (assets[k] === "USDC") {
            tokenUsdc = (await UsdcMockedToken.deploy(
                TOTAL_SUPPLY_6_DECIMALS,
                6
            )) as UsdcMockedToken;
            await tokenUsdc.deployed();
            assetsAddr.push(tokenUsdc.address);
            lastUpdateTimestamps.push(executionTimestamp);
        }

        if (assets[k] === "DAI") {
            tokenDai = (await DaiMockedToken.deploy(
                TOTAL_SUPPLY_18_DECIMALS,
                18
            )) as DaiMockedToken;
            await tokenDai.deployed();
            assetsAddr.push(tokenDai.address);
            lastUpdateTimestamps.push(executionTimestamp);
        }
    }

    iporToken = (await IporToken.deploy(
        "IPOR Token",
        "IPOR",
        await accounts[0].getAddress()
    )) as IporToken;

    if (tokenUsdt) {
        ipTokenUsdt = (await IpToken.deploy("IP USDT", "ipUSDT", tokenUsdt.address)) as IpToken;
        await ipTokenUsdt.setJoseph(await accounts[0].getAddress());
    }

    if (tokenUsdc) {
        ipTokenUsdc = (await IpToken.deploy("IP USDC", "ipUSDC", tokenUsdc.address)) as IpToken;

        await ipTokenUsdc.setJoseph(await accounts[0].getAddress());
    }

    if (tokenDai) {
        ipTokenDai = (await IpToken.deploy("IP DAI", "ipDAI", tokenDai.address)) as IpToken;
        await ipTokenDai.setJoseph(await accounts[0].getAddress());
    }

    return {
        executionTimestamp,
        tokenDai,
        tokenUsdt,
        tokenUsdc,
        ipTokenUsdt,
        ipTokenUsdc,
        ipTokenDai,
        iporToken,
    };
};

export const prepareApproveForUsers = async (
    users: Signer[],
    asset: AssetsType,
    testData: TestData
) => {
    for (let i = 0; i < users.length; i++) {
        if (asset === "USDT") {
            await testData?.tokenUsdt
                ?.connect(users[i])
                ?.approve(testData?.josephUsdt?.address || "", TOTAL_SUPPLY_6_DECIMALS);
            await testData?.tokenUsdt
                ?.connect(users[i])
                ?.approve(testData?.miltonUsdt?.address || "", TOTAL_SUPPLY_6_DECIMALS);
        }

        if (asset === "USDC") {
            await testData?.tokenUsdc
                ?.connect(users[i])
                ?.approve(testData?.josephUsdc?.address || "", TOTAL_SUPPLY_6_DECIMALS);
            await testData?.tokenUsdc
                ?.connect(users[i])
                ?.approve(testData?.miltonUsdc?.address || "", TOTAL_SUPPLY_6_DECIMALS);
        }

        if (asset === "DAI") {
            await testData?.tokenDai
                ?.connect(users[i])
                ?.approve(testData?.josephDai?.address || "", TOTAL_SUPPLY_18_DECIMALS);
            await testData?.tokenDai
                ?.connect(users[i])
                ?.approve(testData?.miltonDai?.address || "", TOTAL_SUPPLY_18_DECIMALS);
        }
    }
};

export const setupTokenDaiInitialValuesForUsers = async (users: Signer[], testData: TestData) => {
    for (let i = 0; i < users.length; i++) {
        await testData?.tokenDai?.setupInitialAmount(
            await users[i].getAddress(),
            USER_SUPPLY_10MLN_18DEC
        );
    }
};

