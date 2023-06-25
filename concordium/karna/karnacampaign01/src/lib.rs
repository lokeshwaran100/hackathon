//! # A Concordium V1 smart contract
use concordium_std::*;
use core::fmt::Debug;

/// Campaign status.
#[derive(Serialize, SchemaType, Clone)]
pub struct State {
    /// The campaign status.
    campaign_status: CampaignStatus,
}

/// Campaign states.
#[derive(Debug, Serialize, SchemaType, Eq, PartialEq, Clone)]
enum CampaignStatus {
    Active,
    Closed,
}

#[derive(Deserial, SchemaType)]
struct ClaimAmount {
    /// amount
    amount: Amount,
}

/// campaign errors.
#[derive(Debug, PartialEq, Eq, Reject, Serial, SchemaType)]
enum Error {
    /// Failed parsing the parameter.
    #[from(ParseError)]
    ParseParamsError,
    NotEnoughFund,
    NotClaimable,
    ContractAddressError,
}

/// Init function that creates a new smart contract.
#[init(contract = "karnacampaign01")]
fn init<S: HasStateApi>(
    _ctx: &impl HasInitContext,
    _state_builder: &mut StateBuilder<S>,
) -> InitResult<State> {
    Ok(State {campaign_status: CampaignStatus::Active})
}

/// Receive function. The input parameter is the boolean variable `throw_error`.
///  If `throw_error == true`, the receive function will throw a custom error.
///  If `throw_error == false`, the receive function executes successfully.
#[receive(
    contract = "karnacampaign01",
    name = "donate",
    error = "Error",
    payable
)]
fn donate<S: HasStateApi>(
    _ctx: &impl HasReceiveContext,
    _host: &impl HasHost<State, StateApiType = S>,
    _amount: Amount,
) -> ReceiveResult<()> {
    Ok(())
}

/// Receive function. The input parameter is the boolean variable `throw_error`.
///  If `throw_error == true`, the receive function will throw a custom error.
///  If `throw_error == false`, the receive function executes successfully.
#[receive(
    contract = "karnacampaign01",
    name = "claim",
    parameter = "ClaimAmount",
    error = "Error",
    mutable
)]
fn claim<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State, StateApiType = S>,
) -> ReceiveResult<()> {
    let claim_amount: ClaimAmount = ctx.parameter_cursor().get()?;
    ensure!(host.self_balance() >= claim_amount.amount);
    let address = match ctx.sender() {
        Address::Account(account_address) => account_address,
        Address::Contract(_) => bail!(Error::ContractAddressError.into()),
    };
    Ok(host.invoke_transfer(&address, claim_amount.amount)?)
}

/// View function that returns the donation amount left.
#[receive(contract = "karnacampaign01", name = "view", return_value = "Amount")]
fn view<'b, S: HasStateApi>(
    _ctx: &impl HasReceiveContext,
    host: &'b impl HasHost<State, StateApiType = S>,
) -> ReceiveResult<Amount> {
    Ok(host.self_balance())
}

#[concordium_cfg_test]
mod tests {
    use super::*;
    use test_infrastructure::*;

    type ContractResult<A> = Result<A, Error>;

    #[concordium_test]
    /// Test that initializing the contract succeeds with some state.
    fn test_init() {
        let ctx = TestInitContext::empty();

        let mut state_builder = TestStateBuilder::new();

        let state_result = init(&ctx, &mut state_builder);
        state_result.expect_report("Contract initialization results in error");
    }

    #[concordium_test]
    /// Test that invoking the `receive` endpoint with the `false` parameter
    /// succeeds in updating the contract.
    fn test_throw_no_error() {
        let ctx = TestInitContext::empty();

        let mut state_builder = TestStateBuilder::new();

        // Initializing state
        let initial_state = init(&ctx, &mut state_builder).expect("Initialization should pass");

        let mut ctx = TestReceiveContext::empty();

        let throw_error = false;
        let parameter_bytes = to_bytes(&throw_error);
        ctx.set_parameter(&parameter_bytes);

        let mut host = TestHost::new(initial_state, state_builder);

        // Call the contract function.
        let result: ContractResult<()> = receive(&ctx, &mut host);

        // Check the result.
        claim!(result.is_ok(), "Results in rejection");
    }

    #[concordium_test]
    /// Test that invoking the `receive` endpoint with the `true` parameter
    /// results in the `YourError` being thrown.
    fn test_throw_error() {
        let ctx = TestInitContext::empty();

        let mut state_builder = TestStateBuilder::new();

        // Initializing state
        let initial_state = init(&ctx, &mut state_builder).expect("Initialization should pass");

        let mut ctx = TestReceiveContext::empty();

        let throw_error = true;
        let parameter_bytes = to_bytes(&throw_error);
        ctx.set_parameter(&parameter_bytes);

        let mut host = TestHost::new(initial_state, state_builder);

        // Call the contract function.
        let error: ContractResult<()> = receive(&ctx, &mut host);

        // Check the result.
        claim_eq!(error, Err(Error::YourError), "Function should throw an error.");
    }
}
