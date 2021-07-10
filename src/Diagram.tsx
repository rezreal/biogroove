import React, {RefObject, createRef, useEffect} from "react";
import "./Diagram.css"
import * as d3 from "d3"
import {Funscript, FunscriptAction} from "./Funscript";

const Diagram = (params: {script: Funscript}) => {

    const ref: RefObject<SVGSVGElement> = createRef()
    const data = params.script.actions;


    useEffect(() => {

        if (!ref.current) {
            return;
        }

        var margin = {top: 10, right: 30, bottom: 30, left: 60},
            width = 800 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        const svg = d3.select(ref.current!)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

            var scalePos = d3.scaleLinear()
                .domain([0, 100])
                .range([ height, 0 ]);
            var scaleAt = d3.scaleLinear()
                //.domain([Date.now(), Date.now() + 24 * 60 * 60 * 1000])
                .domain([0, d3.max(data, e=>e.at)!])
                .nice()
                .range([ 0, width ]);

            // Add X axis --> it is a date format
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(scaleAt)
                    .ticks(Math.min(scaleAt.domain()[1] / 1000, 50))
                    .tickFormat((d) => `${(d as number) / 1000}s`)
                );

            // Add Y axis
            svg.append("g")
                .call(d3.axisLeft(scalePos));

            const line = d3.line<FunscriptAction>()
                .x( d=> scaleAt(d.at) )
                .y( d=> scalePos(d.pos));

            // Add the line
            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1.5)
                .attr("d",  line);

    }, [data, ref])
    return (
        <svg
            ref={ref}
        />
    )
}

export default Diagram
