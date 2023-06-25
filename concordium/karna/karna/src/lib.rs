//! # A Concordium V1 smart contract
use concordium_std::*;
use core::fmt::Debug;

/// The contract state
#[derive(Serial, DeserialWithState, Deletable, StateClone)]
#[concordium(state_parameter = "S")]
struct State<S> {
    /// The campaigns registered
    campaigns: StateSet<ContractAddress, S>,
}

#[derive(Deserial, SchemaType)]
struct Campaign {
    /// campaign address
    contract: ContractAddress,
    /// amount
    amount: Amount,
}

/// Your smart contract errors.
#[derive(Debug, PartialEq, Eq, Reject, Serial, SchemaType)]
enum Error {
    /// Failed parsing the parameter.
    #[from(ParseError)]
    ParseParamsError,
    /// Your error
    NonContractAddressError,
    UnauthorizedError,
}

/// Init function that creates a new smart contract.
#[init(contract = "karna")]
fn init<S: HasStateApi>(
    ctx: &impl HasInitContext,
    state_builder: &mut StateBuilder<S>,
) -> InitResult<State<S>> {
    Ok(State {campaigns: state_builder.new_set()})
}

/// Receive function. The input parameter is the boolean variable `throw_error`.
///  If `throw_error == true`, the receive function will throw a custom error.
///  If `throw_error == false`, the receive function executes successfully.
#[receive(
    contract = "karna",
    name = "donate",
    error = "Error",
    payable
)]
fn donate<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
    _amount: Amount,
) -> ReceiveResult<()> {
    let owner = ctx.owner();
    let percentage: u64 = host.self_balance().micro_ccd * 1 / 100;
    Ok(host.invoke_transfer(&owner, Amount{ micro_ccd: percentage })?)
}

/// Receive function
#[receive(
    contract = "karna",
    name = "register_campaign",
    parameter = "Campaign",
    error = "Error",
    mutable
)]
fn register_campaign<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
) -> ReceiveResult<()> {
    let param: Campaign = ctx.parameter_cursor().get()?;
    ensure!(ctx.sender().matches_account(&ctx.owner()));
    host.state_mut().campaigns.insert(param.contract);
    // let address = match param.contract {
    //     Address::Account(_) => bail!(Error::NonContractAddressError.into()),
    //     Address::Contract(account_address) => account_address,
    // };
    let amount = Amount{ micro_ccd: param.amount.micro_ccd };
    let (result, _) = host.invoke_contract_raw(&param.contract, Parameter::new_unchecked(&0u64.to_le_bytes()[..]), EntrypointName::new_unchecked("donate"), amount)?;
    Ok(())
}

/// View function that returns the content of the state.
#[receive(contract = "karna", name = "view", return_value = "Amount")]
fn view<'b, S: HasStateApi>(
    _ctx: &impl HasReceiveContext,
    host: &'b impl HasHost<State<S>, StateApiType = S>,
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
