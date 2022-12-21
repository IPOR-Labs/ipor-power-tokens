import { BigNumber } from "ethers";

export const ZERO = BigNumber.from("0");

// #################################################################################
//                              18 decimals
// #################################################################################

export const N1__0_18DEC = BigNumber.from("1000000000000000000");
export const N2__0_18DEC = BigNumber.from("2000000000000000000");
export const N0__1_18DEC = BigNumber.from("100000000000000000");
export const N0__5_18DEC = BigNumber.from("500000000000000000");
export const N0__01_18DEC = BigNumber.from("10000000000000000");


export const USD_1_000_000_18DEC = BigNumber.from("1000000").mul(N1__0_18DEC);


export const TOTAL_SUPPLY_18_DECIMALS = BigNumber.from("10000000000000000").mul(N1__0_18DEC);

// #################################################################################
//                              8 decimals
// #################################################################################

export const N1__0_8DEC = BigNumber.from("100000000");

// #################################################################################
//                              6 decimals
// #################################################################################

export const N1__0_6DEC = BigNumber.from("1000000");
export const USD_1_000_000 = BigNumber.from("1000000");
export const TOTAL_SUPPLY_6_DECIMALS = BigNumber.from("100000000000000").mul(N1__0_6DEC);

// #################################################################################
//                              Time
// #################################################################################
export const COOLDOWN_SECONDS = BigNumber.from(7 * 24 * 50 * 60);
