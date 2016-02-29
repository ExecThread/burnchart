import React from 'react';
import _ from 'lodash';
import cls from 'classnames';

import format from '../modules/format.js';

import actions from '../actions/appActions.js';

import Icon from './Icon.jsx';
import Link from './Link.jsx';

export default React.createClass({

  displayName: 'Milestones.jsx',

  // Cycle through milestones sort order.
  _onSort() {
    actions.emit('projects.sort');
  },

  render() {
    let { projects, project } = this.props;

    // Show the projects with errors first.
    let errors = _(projects.list).filter('errors').map((project, i) => {
      let text = project.errors.join('\n');
      return (
        <tr key={`err-${i}`}>
          <td colSpan="3" className="repo">
            <div className="project">{project.owner}/{project.name}
              <span className="error" title={text}><Icon name="warning"/></span>
            </div>
          </td>
        </tr>
      );
    }).value();

    // Now for the list of milestones, index sorted.
    let totalCompleted = 0;
    let totalStillOpen = 0;
    let list = [];
    _.each(projects.index, ([ pI, mI ]) => {
      let { owner, name, milestones } = projects.list[pI];
      let milestone = milestones[mI];
      let completed = milestone.issues.closed.size;
      let stillOpen = milestone.issues.open.size;
      totalCompleted += completed;
      totalStillOpen += stillOpen;

      // Filter down?
      if (!(!project || (project.owner == owner && project.name == name))) return;

      list.push(
        <tr className={cls({ 'done': milestone.stats.isDone })} key={`${pI}-${mI}`}>
          <td className="repo">
            <Link
              route={{ 'to': 'milestones', 'params': { owner, name } }}
              className="project"
            >
              {owner}/{name}
            </Link>
          </td>
          <td>
            <Link
              route={{ 'to': 'chart', 'params': { owner, name, 'milestone': milestone.number } }}
              className="milestone"
            >
              {milestone.title}
            </Link>
          </td>
          <td style={{ 'width': '1%' }}>
            <div className="progress">
              <span className="percent">{completed}/{completed+stillOpen} {Math.floor(milestone.stats.progress.points)}%</span>
              <span className={cls('due', { 'red': milestone.stats.isOverdue })}>
                {format.due(milestone.due_on)}
              </span>
              <div className="outer bar">
                <div
                  className={cls('inner', 'bar', { 'green': milestone.stats.isOnTime, 'red': !milestone.stats.isOnTime })}
                  style={{ 'width': `${milestone.stats.progress.points}%` }}
                />
              </div>
            </div>
          </td>
        </tr>
      );
    });
    let totalCompletePercent = 100*totalCompleted/(totalCompleted+totalStillOpen);

    // Wait for something to show.
    if (!errors.length && !list.length) return false;

    if (project) {
      // Project-specific milestones.
      return (
        <div id="projects">
          <div className="header">
            <table><tbody>
                <tr>
                    <td><h2>Milestones</h2></td>
                    <td style={{ 'width': '1%' }}><div className="progress">
                      <span className="percent">{Math.floor(totalCompletePercent)}%</span>
                      <span className='black'>
                        {totalCompleted}/{totalCompleted+totalStillOpen}
                      </span>
                      <div className="outer bar">
                        <div
                          className={cls('inner', 'bar', { 'black': true })}
                          style={{ 'width': `${totalCompletePercent}%` }}
                        />
                      </div>
                    </div></td>
                    <td><a className="sort" onClick={this._onSort}><Icon name="sort"/> Sorted by {projects.sortBy}</a></td>
                </tr>
            </tbody></table>
          </div>
          <table>
            <tbody>{list}</tbody>
          </table>
          <div className="footer" />
        </div>
      );
    } else {
      // List of projects and their milestones.
      return (
        <div id="projects">
          <div className="header">
            <table><tbody>
                <tr>
                    <td><h2>Projects</h2></td>
                    <td style={{ 'width': '1%' }}><div className="progress">
                      <span className="percent">{Math.floor(totalCompletePercent)}%</span>
                      <span className='black'>
                        {totalCompleted}/{totalCompleted+totalStillOpen}
                      </span>
                      <div className="outer bar">
                        <div
                          className={cls('inner', 'bar', { 'black': true })}
                          style={{ 'width': `${totalCompletePercent}%` }}
                        />
                      </div>
                    </div></td>
                    <td><a className="sort" onClick={this._onSort}><Icon name="sort"/> Sorted by {projects.sortBy}</a></td>
                </tr>
            </tbody></table>
          </div>
          <table>
            <tbody>
              {errors}
              {list}
            </tbody>
          </table>
          <div className="footer">
            <a onClick={this.props.onToggleMode}>Edit Projects</a>
          </div>
        </div>
      );
    }
  }

});
