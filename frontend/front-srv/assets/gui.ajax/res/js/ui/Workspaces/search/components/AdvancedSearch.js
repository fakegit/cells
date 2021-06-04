import React, { Component } from 'react';

import XMLUtils from 'pydio/util/xml';
import {IconButton, Subheader} from 'material-ui';

/*
 * Copyright 2007-2017 Charles du Jeu - Abstrium SAS <team (at) pyd.io>
 * This file is part of Pydio.
 *
 * Pydio is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Pydio is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Pydio.  If not, see <http://www.gnu.org/licenses/>.
 *
 * The latest code can be found at <https://pydio.com>.
 */

import PropTypes from 'prop-types';

import Pydio from 'pydio'
const {PydioContextConsumer} = Pydio.requireLib('boot');
const {ModernTextField, ModernStyles} = Pydio.requireLib('hoc');

import DatePanel from './DatePanel';
import FileFormatPanel from './FileFormatPanel';
import FileSizePanel from './FileSizePanel';
import {debounce} from 'lodash';
import SearchScopeSelector from "./SearchScopeSelector";

const FieldRow = ({name, label, values, children, style, onRemove = ()=>{}}) => {
    let labelStyle= {
        width: 100,
        fontSize: 13,
        fontWeight: 500,
        color: '#616161',
        height: 34,
        lineHeight: '35px',
        padding: '0 7px',
        borderRadius: 4,
        marginTop: 6,
        marginRight: 8,
        overflow:'hidden',
        textOverflow:'ellipsis',
        whiteSpace:'nowrap',
        display:'flex'
    }
    let active, actualKey= name;
    if(values[name]) {
        active = true;
        if(name === 'scope') {
            active = values[name] !== 'all'
        }
    } else if(values['ajxp_meta_'+name]) {
        actualKey = 'ajxp_meta_'+name
        active = true
    }
    if(active){
        labelStyle = {...labelStyle, backgroundColor: '#e8f5e9', color:'#43a047'}
    }
    return (
        <div style={{display:'flex', alignItems:'flex-start', margin:'0 16px', ...style}}>
            <div style={labelStyle}>
                {active?<span className={"mdi mdi-close"} onClick={()=>onRemove(actualKey)} style={{cursor:'pointer'}}/>:""}
                <div style={{flex: 1, textAlign:'right'}}>{label}</div>
            </div>
            <div style={{flex: 1}}>{children}</div>
        </div>
    );
}

class AdvancedSearch extends Component {

    static get styles() {
        return {
            text: {}
        }
    }

    constructor(props) {
        super(props);

        const {pydio} = props;
        const registry = pydio.getXmlRegistry();
        let options = {}
        try {
            options = JSON.parse(XMLUtils.XPathGetSingleNodeText(registry, 'client_configs/template_part[@ajxpClass="SearchEngine" and @theme="material"]/@ajxpOptions'));
        } catch (e){}


        this.state = {
            options,
            basenameOrContent: props.values['basenameOrContent'] || ''
        };
    }

    textFieldChange(fieldName, value){
        this.props.onChange({[fieldName]:value});
    }

    onChange(values) {
        this.props.onChange(values)
    }

    renderField(key, val) {

        const {text} = AdvancedSearch.styles;
        const fieldname = (key === 'basename' || key === 'Content' || key === 'basenameOrContent') ? key : 'ajxp_meta_' + key;

        if (typeof val === 'object') {
            const value = this.props.values[fieldname];
            const {label, renderComponent} = val;

            // The field might have been assigned a method already
            if (renderComponent) {
                return renderComponent({
                    ...this.props,
                    label,
                    value,
                    fieldname:key,
                    onChange: (object)=>{this.onChange(object)}
                });
            }
        }

        return (
            <ModernTextField
                key={fieldname}
                value={this.props.values[fieldname] || ''}
                style={text}
                hintText={val}
                fullWidth={true}
                onChange={(e,v) => {this.textFieldChange(fieldname, v)}}
            />
        );
    }

    clearAll() {
        const {values, onChange} = this.props;
        let clearVals = {}
        Object.keys(values).forEach(k => {
            if(k === 'basenameOrContent') {
                clearVals[k] = values[k]
            } else if (k === 'scope') {
                clearVals[k] = 'all'
            } else {
                clearVals[k] = undefined;
            }
        })
        onChange(clearVals);
    }

    render() {

        const {text} = AdvancedSearch.styles;

        const {pydio, getMessage, values, rootStyle, showScope} = this.props;
        const {options} = this.state;
        const headerStyle = {
            fontSize: 13,
            color: 'rgb(144 165 178)',
            textTransform: 'uppercase',
            fontWeight: 500,
            marginBottom: -10,
            marginTop: 10
        };
        const linkStyle = {
            padding: '12px 20px 0',
            color: '#9e9e9e',
            textDecoration: 'underline',
            cursor: 'pointer'
        }

        const onRemove = (key) => {
            const newValues = {...values}
            newValues[key] = key === 'scope' ? 'all' : undefined;
            this.onChange(newValues);
        }
        const rowProps = {
            values,
            onRemove
        }

        const {basenameOrContent, scope, ...others} = values;
        let showClear = scope !== 'all' || (others && Object.keys(others).length > 0)

        return (
            <div className="search-advanced" style={{...rootStyle}}>
                <div style={{display:'flex'}}>
                    <Subheader style={{...headerStyle, marginTop: 0, flex: 1}}>{getMessage(341)}</Subheader>
                    {showClear &&
                        <div style={linkStyle}>
                            <a onClick={()=>this.clearAll()}>Clear</a>
                        </div>
                    }
                </div>
                <FieldRow {...rowProps} name={"basenameOrContent"} label={getMessage(1)}>{this.renderField('basenameOrContent',getMessage(1))}</FieldRow>
                {showScope &&
                    <FieldRow {...rowProps} name={"scope"} label={"Search in..."} style={{marginRight:16}}>
                        <SearchScopeSelector value={values.scope} onChange={(scope)=>{this.onChange({...values, scope})}} onClick={()=>{}} asField={true}/>
                    </FieldRow>
                }
                <FieldRow {...rowProps} name={"ajxp_mime"} label={"Format"}>
                    <FileFormatPanel compact={showScope} values={values} pydio={pydio} inputStyle={text} onChange={(values) => this.onChange(values)} />
                </FieldRow>

                <Subheader style={{...headerStyle, marginTop: 0}}>{getMessage(489)}</Subheader>
                <AdvancedMetaFields {...this.props} options={options}>
                    {fields =>
                        <div>
                            {Object.keys(fields).map((key) =>
                                <FieldRow {...rowProps} name={key} label={fields[key].label}>{this.renderField(key, fields[key])}</FieldRow>
                            )}
                        </div>
                    }
                </AdvancedMetaFields>

                <Subheader style={{...headerStyle}}>{getMessage(498)}</Subheader>
                <FieldRow {...rowProps} name={"ajxp_modiftime"} label={"Modified"}>
                    <DatePanel values={values} pydio={pydio} inputStyle={text} onChange={(values) => this.onChange(values)} />
                </FieldRow>
                <FieldRow {...rowProps} name={"ajxp_bytesize"} label={"File Size"}>
                    <FileSizePanel values={values} pydio={pydio} inputStyle={text} onChange={(values) => this.onChange(values)} />
                </FieldRow>
            </div>
        )
    }
}

AdvancedSearch = PydioContextConsumer(AdvancedSearch);

class AdvancedMetaFields extends Component {

    constructor(props) {
        super(props);
        this.dbuild = debounce(this.build, 500);
        this.state = {
            fields: {}
        }
    }

    componentWillMount() {
        this.build()
    }

    build() {

        const {options} = this.props;
        let {metaColumns, reactColumnsRenderers} = {...options};
        if(!metaColumns){
            metaColumns = {};
        }
        if(!reactColumnsRenderers){
            reactColumnsRenderers = {};
        }

        const generic = {};

        // Looping through the options to check if we have a special renderer for any
        const specialRendererKeys = Object.keys({...reactColumnsRenderers});
        const standardRendererKeys = Object.keys({...metaColumns}).filter((key) => specialRendererKeys.indexOf(key) === -1);

        const textFields = {};
        standardRendererKeys.forEach(k => {
            textFields[k] = metaColumns[k];
        });

        const renderers = Object.keys({...reactColumnsRenderers}).map((key) => {
            const renderer = reactColumnsRenderers[key];
            const namespace = renderer.split('.',1).shift();

            // If the renderer is not loaded in memory, we trigger the load and send to rebuild
            if (!window[namespace]) {
                ResourcesManager.detectModuleToLoadAndApply(renderer, () => this.dbuild(), true);
                return
            }

            return {
                [key]: {
                    label: metaColumns[key],
                    renderComponent: FuncUtils.getFunctionByName(renderer, global)
                }
            }
        }).reduce((obj, current) => obj = {...obj, ...current}, []);

        const fields = {
            ...generic,
            ...textFields,
            ...renderers
        };

        this.setState({
            fields
        })
    }

    render() {
        return this.props.children(this.state.fields)
    }
}

AdvancedMetaFields.propTypes = {
    children: PropTypes.func.isRequired,
};

export default AdvancedSearch
