/** @format */

import {
	Badge,
	Card,
	message,
	PageHeader,
	Slider,
	Space,
	Statistic,
	Switch,
} from 'antd';
import React, { Component } from 'react';
import { store, updateBatteryLimit } from '../../Store/ReduxStore';

interface Props {}

interface State {
	batteryLimit: number | undefined;
	batteryLimitDisabled: boolean;
	drain: number;
	chargerState:
		| '180w Charger'
		| 'Battery'
		| 'USB-C Charger'
		| 'RIP idk *shrug*';
}

export default class Battery extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		let redux = store.getState() as G14Config;
		let limit = redux.current.batteryLimit;
		this.state = {
			batteryLimit: limit,
			batteryLimitDisabled: true,
			drain: 0,
			chargerState: 'RIP idk *shrug*',
		};
	}

	changeBatteryLimit = (value: number) => {
		if (value >= 20) {
			this.setState({ batteryLimit: value });
		}
	};

	handleDisabledChange = (value: boolean) => {
		this.setState({ batteryLimitDisabled: !value });
	};

	dischargeListener = (event: any, amount: number) => {
		let { drain } = this.state;
		if (amount > 0 && drain === 0) {
			this.getDeliveryStatus();
		} else if (amount === 0 && drain > 0) {
			this.getDeliveryStatus();
		}
		console.log(event, amount);
		this.setState({ drain: amount });
	};

	buildListener = () => {
		window.ipcRenderer.on('dischargeRate', this.dischargeListener);
	};

	getDeliveryStatus = () => {
		window.ipcRenderer.invoke('isPlugged').then(
			(
				result:
					| false
					| {
							ac: boolean;
							dc: boolean;
							usb: boolean;
					  }
			) => {
				if (result) {
					let { ac, dc, usb } = result;
					let chargerState:
						| '180w Charger'
						| 'Battery'
						| 'USB-C Charger'
						| 'RIP idk *shrug*' = ac
						? '180w Charger'
						: dc
						? 'Battery'
						: usb
						? 'USB-C Charger'
						: 'RIP idk *shrug*';
					this.setState({ chargerState });
				} else {
					message.error('There was a problem finding power delivery method.');
				}
			}
		);
	};

	batterySwitch = () => {
		console.log('Battery switch event occurred.');
		this.setState({ chargerState: 'Battery' });
	};

	chargerSwitch = () => {
		console.log('Charger switch event occured.');
		this.getDeliveryStatus();
	};

	componentDidMount() {
		this.buildListener();
		this.getDeliveryStatus();
	}

	componentWillUnmount = () => {
		window.ipcRenderer.off('dischargeRate', this.dischargeListener);
	};

	handleSubmitBatteryLimit = () => {
		let { batteryLimit } = this.state;
		if (batteryLimit && batteryLimit >= 20) {
			message.loading('Submitting battery charge limit...');
			window.ipcRenderer
				.invoke('setBatteryLimiter', batteryLimit)
				.then((result: boolean) => {
					if (result) {
						message.success(
							'Successfully set battery limit to: ' + batteryLimit + '%'
						);
						store.dispatch(updateBatteryLimit(batteryLimit as number));
					}
				});
		}
	};

	render() {
		let { batteryLimit, batteryLimitDisabled } = this.state;
		return (
			<>
				<PageHeader
					title="Battery Configuration"
					subTitle="power delivery, charge limits & drain"></PageHeader>

				<Badge.Ribbon text="Battery Charge Limiter">
					<Card headStyle={{ background: '#B7B8BA' }}>
						<Space
							direction="vertical"
							style={{ width: '90%', marginLeft: '5%' }}>
							<div style={{ display: 'inline-flex' }}>
								<h3 style={{ marginTop: '.3rem', marginBottom: '0rem' }}>
									Enable charge modification:
								</h3>
								<Switch
									style={{ marginLeft: '1rem', marginTop: '.6rem' }}
									title={'Modify Battery Charge Limit'}
									size="small"
									checked={!batteryLimitDisabled}
									onChange={this.handleDisabledChange}
								/>
							</div>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									width: '100%',
								}}>
								<Slider
									style={{ width: '80%', marginTop: '2rem' }}
									onChange={this.changeBatteryLimit}
									min={0}
									max={100}
									step={5}
									onAfterChange={this.handleSubmitBatteryLimit}
									disabled={batteryLimitDisabled}
									value={batteryLimit ? batteryLimit : 0}></Slider>
								<Statistic
									title="Battery Limit"
									style={{ marginTop: '-.3rem', width: '15%' }}
									valueStyle={{ fontSize: '15px' }}
									value={
										batteryLimit ? `${batteryLimit}%` : 'Unset'
									}></Statistic>
							</div>
						</Space>
					</Card>
				</Badge.Ribbon>
				<Card>
					<Space
						direction="horizontal"
						style={{
							width: '100%',
							display: 'flex',
							justifyContent: 'space-between',
						}}>
						<Statistic
							style={{ marginLeft: '2 rem' }}
							title="Battery Drain"
							prefix={this.state.drain > 0 ? '-' : ''}
							valueStyle={{ fontSize: '22px' }}
							value={this.state.drain}
							suffix=" mW"></Statistic>
						<div
							style={{
								fontWeight: 'normal',
								fontSize: '20px',
								marginRight: '2rem',
							}}>
							<small style={{ marginRight: '.5rem' }}>Power Delivery:</small>
							{this.state.chargerState}
						</div>
					</Space>
				</Card>
			</>
		);
	}
}
