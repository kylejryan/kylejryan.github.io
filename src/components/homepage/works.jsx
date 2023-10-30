import React from "react";
import { faBriefcase } from "@fortawesome/free-solid-svg-icons";

import Card from "../common/card";

import "./styles/works.css";

const Works = () => {
	return (
		<div className="works">
			<Card
				icon={faBriefcase}
				title="Work"
				body={
					<div className="works-body">
						<div className="work">
							<img
								src="./stealth.png"
								alt="stealth"
								className="work-image"
							/>
							<div className="work-title">Dune Security</div>
							<div className="work-subtitle">
								Software Engineer
							</div>
							<div className="work-duration">2023 - Present</div>
						</div>

						<div className="work">
							<img
								src="./fordham.png"
								alt="fordham"
								className="work-image"
							/>
							<div className="work-title">Fordham University</div>
							<div className="work-subtitle">
								Adjunct Professor
							</div>
							<div className="work-duration">2023 - Present</div>
						</div>
					</div>
				}
			/>
		</div>
	);
};

export default Works;
