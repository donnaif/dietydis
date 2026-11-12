/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Things ChannelTabs imports from Equicord's @webpack/common and @components/Icons that Vencord
// does not export. Finders and SVG paths are copied from Equicord (GPL-3.0).

import { filters, findByCodeLazy, mapMangledModuleLazy } from "@webpack";
import type { JSX, PropsWithChildren } from "react";

// ---- Discord modules (Equicord: src/webpack/common/utils.ts) ----
export const useDrag = findByCodeLazy("useDrag::spec.begin was deprecated");
export const useDrop = findByCodeLazy(".disconnectDropTarget()", ".dropTargetOptions=");
export const ReadStateUtils = mapMangledModuleLazy('type:"ENABLE_AUTOMATIC_ACK",', {
    ackChannel: filters.byCode(".isForumLikeChannel(")
});

// ---- Icons (Equicord: src/components/Icons.tsx) ----
type IconProps = JSX.IntrinsicElements["svg"];

function Icon({ height = 24, width = 24, children, viewBox, ...svgProps }: PropsWithChildren<IconProps>) {
    return (
        <svg {...svgProps} height={height} width={width} viewBox={viewBox} role="img">
            {children}
        </svg>
    );
}

export function XLargeBoldIcon(props: IconProps) {
    return (
        <Icon {...props} viewBox="0 0 24 24">
            <path fill={props.fill || "currentColor"} d="M18.94 21.06a1.5 1.5 0 1 0 2.12-2.12L14.12 12l6.94-6.94a1.5 1.5 0 1 0-2.12-2.12L12 9.88 5.06 2.94a1.5 1.5 0 1 0-2.12 2.12L9.88 12l-6.94 6.94a1.5 1.5 0 1 0 2.12 2.12L12 14.12l6.94 6.94Z" />
        </Icon>
    );
}

export function UnsendIcon(props: IconProps) {
    return (
        <Icon {...props} viewBox="0 0 24 24">
            <path fill={props.fill || "currentColor"} d="M3 2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 0-2H5.07a8 8 0 1 1 13.29 8.86l-.01.01a7.97 7.97 0 0 1-1.9 1.78 1 1 0 0 0 1.1 1.67c.19-.12.36-.25.53-.38.7-.54 1.32-1.16 1.85-1.85l.01-.01A9.95 9.95 0 0 0 22 12 10 10 0 0 0 4 6V3a1 1 0 0 0-1-1ZM3.18 14.06a1 1 0 0 0-.61 1.27c.11.33.24.64.4.95a1 1 0 0 0 1.8-.86c-.12-.24-.22-.5-.32-.75a1 1 0 0 0-1.27-.61ZM5.33 18.12a1 1 0 0 0 .09 1.41c.51.45 1.07.85 1.67 1.18a1 1 0 0 0 .98-1.74 8.02 8.02 0 0 1-1.33-.95 1 1 0 0 0-1.41.1ZM14.17 20.8a1 1 0 0 0-1.12-.87 8.08 8.08 0 0 1-1.87.03 1 1 0 1 0-.2 1.99 10.1 10.1 0 0 0 2.32-.03 1 1 0 0 0 .87-1.13Z" />
        </Icon>
    );
}

export function WindowTopOutlineIcon(props: IconProps) {
    return (
        <Icon {...props} viewBox="0 0 24 24">
            <path fill={props.fill || "currentColor"} d="M4 5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v.18a1 1 0 1 0 2 0V5a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h.18a1 1 0 1 0 0-2H5a1 1 0 0 1-1-1V5Z" />
            <path fill={props.fill || "currentColor"} fillRule="evenodd" clipRule="evenodd" d="M8 11a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3v-8Zm2 0a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-8Z" />
        </Icon>
    );
}

export function BookCheckIcon(props: IconProps) {
    return (
        <Icon {...props} viewBox="0 0 24 24">
            <path fill={props.fill || "currentColor"} fillRule="evenodd" clipRule="evenodd" d="M15 2a3 3 0 0 1 3 3v12H5.5a1.5 1.5 0 0 0 0 3h14a.5.5 0 0 0 .5-.5V5h1a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h10Zm-.3 5.7a1 1 0 0 0-1.4-1.4L9 10.58l-2.3-2.3a1 1 0 0 0-1.4 1.42l3 3a1 1 0 0 0 1.4 0l5-5Z" />
        </Icon>
    );
}

export function TrashIcon(props: IconProps) {
    return (
        <Icon {...props} viewBox="0 0 24 24">
            <path fill={props.fill || "currentColor"} d="M14.25 1c.41 0 .75.34.75.75V3h5.25c.41 0 .75.34.75.75v.5c0 .41-.34.75-.75.75H3.75A.75.75 0 0 1 3 4.25v-.5c0-.41.34-.75.75-.75H9V1.75c0-.41.34-.75.75-.75h4.5Z" />
            <path fill={props.fill || "currentColor"} fillRule="evenodd" clipRule="evenodd" d="M5.06 7a1 1 0 0 0-1 1.06l.76 12.13a3 3 0 0 0 3 2.81h8.36a3 3 0 0 0 3-2.81l.75-12.13a1 1 0 0 0-1-1.06H5.07ZM11 12a1 1 0 1 0-2 0v6a1 1 0 1 0 2 0v-6Zm3-1a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Z" />
        </Icon>
    );
}
