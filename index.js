/**
 * Copyright 2024 Google LLC

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Demo {
    constructor() {
        this.playerMessages = {};
        this.url = new URLSearchParams(window.location.search);
        this.session_id = this.url.get('session_id') || '';
        if (this.session_id.length == 0)
            throw new Error('No session specified');
    }
    // Create timeline events from logs/state for chronological display
    createTimelineEvents(logs, state) {
        const events = [];
        const rounds = logs.length;
        for (let round = 0; round < rounds; ++round) {
            const rlog = logs[round];
            // Night phase actions (eliminate, protect, investigate)
            if (rlog.eliminate) {
                // Find which wolf eliminated
                for (const player of Object.keys(state.players)) {
                    if (rlog.eliminate.prompt && rlog.eliminate.prompt.includes(player)) {
                        events.push({
                            type: 'eliminate',
                            phase: 'night',
                            round,
                            player,
                            ...rlog.eliminate
                        });
                        break;
                    }
                }
            }
            if (rlog.protect && rlog.protect.prompt) {
                // Only doctor protects
                for (const player of Object.keys(state.players)) {
                    if (rlog.protect.prompt.includes(player) && state.players[player].role === 'Doctor') {
                        events.push({
                            type: 'protect',
                            phase: 'night',
                            round,
                            player,
                            ...rlog.protect
                        });
                        break;
                    }
                }
            }
            if (rlog.investigate && rlog.investigate.prompt) {
                // Only seer investigates
                for (const player of Object.keys(state.players)) {
                    if (rlog.investigate.prompt.includes(player) && state.players[player].role === 'Seer') {
                        events.push({
                            type: 'investigate',
                            phase: 'night',
                            round,
                            player,
                            ...rlog.investigate
                        });
                        break;
                    }
                }
            }
            // Day phase: Bids (multiple turns)
            if (Array.isArray(rlog.bid)) {
                for (let turn = 0; turn < rlog.bid.length; turn++) {
                    const bidTurn = rlog.bid[turn];
                    if (Array.isArray(bidTurn)) {
                        for (const [name, entry] of bidTurn) {
                            events.push({
                                type: 'bid',
                                phase: 'day',
                                round,
                                turn,
                                player: name,
                                ...entry
                            });
                        }
                    }
                }
            }
            // Day phase: Debate (multiple turns)
            if (Array.isArray(rlog.debate)) {
                for (let turn = 0; turn < rlog.debate.length; turn++) {
                    const [name, entry] = rlog.debate[turn];
                    events.push({
                        type: 'debate',
                        phase: 'day',
                        round,
                        turn,
                        player: name,
                        ...entry
                    });
                }
            }
            // Day phase: Summaries
            if (Array.isArray(rlog.summaries)) {
                for (const [name, entry] of rlog.summaries) {
                    events.push({
                        type: 'summarize',
                        phase: 'day',
                        round,
                        player: name,
                        ...entry
                    });
                }
            }
            // Day phase: Votes (final vote round)
            if (Array.isArray(rlog.votes) && rlog.votes.length > 0) {
                // Take the last voting round as final votes
                const finalVotes = rlog.votes[rlog.votes.length - 1];
                for (const vote of finalVotes) {
                    events.push({
                        type: 'vote',
                        phase: 'day',
                        round,
                        player: vote.player,
                        ...vote.log
                    });
                }
            }
        }
        // Sort events by precise chronological order
        events.sort((a, b) => {
            if (a.round !== b.round)
                return a.round - b.round;
            // Night phase always comes before day phase
            if (a.phase !== b.phase) {
                return a.phase === 'night' ? -1 : 1;
            }
            // Within the same phase, sort by action type and turn
            const phaseOrder = {
                'night': ['eliminate', 'protect', 'investigate'],
                'day': ['bid', 'debate', 'summarize', 'vote']
            };
            const aOrder = phaseOrder[a.phase]?.indexOf(a.type) ?? 999;
            const bOrder = phaseOrder[b.phase]?.indexOf(b.type) ?? 999;
            if (aOrder !== bOrder)
                return aOrder - bOrder;
            // For actions with turns (bid, debate), sort by turn
            if (a.turn !== undefined && b.turn !== undefined) {
                return a.turn - b.turn;
            }
            return 0;
        });
        return events;
    }
    async retrieve_data() {
        // game log (use relative URL to avoid cross-origin issues between localhost and 127.0.0.1)
        const logs_response = await fetch(`/logs/${this.session_id}/game_logs.json`);
        const logs = await logs_response.json();
        console.log("logs", logs);
        // game state
        let state_response = await fetch(`/logs/${this.session_id}/game_complete.json`);
        if (state_response.status == 404) {
            state_response = await fetch(`/logs/${this.session_id}/game_partial.json`);
            console.log("loaded partial file because game_complete.json is not available.");
        }
        const state = await state_response.json();
        console.log("state", state);
        this.data = { logs: logs, state: state };
        // Create timeline events
        const timelineEvents = this.createTimelineEvents(logs, state);
        // Render!
        uiManager.renderTimelineView(timelineEvents, state.players);
        // Process old state for debugging
        this.process_state(this.data['state']);
    }
    process_state(state) {
        /*
          Model -> ablations -> players
        */
        const model = state.model;
        // uiManager.add_ablations();
        uiManager.add_game_file(this.session_id);
        let players = Object.keys(state['players']);
        for (const player of players) {
            uiManager.add_player(state['players'][player]);
        }
        uiManager.add_winner(state['winner']);
    }
    process_logs(data, round_info, round) {
        /*
          Round -> eliminate -> investigate -> protect -> (bid -> debate) ->
          summarize -> vote
        */
        const eliminate = data['eliminate'];
        const investigate = data['investigate'];
        const protect = data['protect'];
        let whoWasKilled = null;
        if (protect) {
            if (eliminate['result']['remove'] !== protect['result']['protect']) {
                whoWasKilled = eliminate['result']['remove'];
            }
        }
        else if (eliminate != null) {
            whoWasKilled = eliminate['result']['remove'];
        }
        uiManager.add_round_header(round, 'Night');
        uiManager.add_roles(eliminate, investigate, protect);
        uiManager.add_eliminated(whoWasKilled);
        uiManager.add_round_header(round, 'Day');
        for (let i = 0; i < 10; i++) {
            uiManager.add_bids(data['bid'][i]);
            uiManager.add_debate(data['debate'][i]);
        }
        if (data['votes'].length > 0) {
            console.log(round_info.players);
            let all_players = round_info.players.concat(round_info.exiled);
            console.log(all_players);
            uiManager.add_votes(data['votes'], all_players);
            uiManager.add_exiled(round_info['exiled']);
            uiManager.add_summaries(data['summaries']);
        }
    }
}
class UIManager {
    constructor() {
        this.player_container = document.getElementById('player-container');
        this.transcript_container = document.getElementById('transcript-container');
        this.debug_container = document.getElementById('debug-container');
        this.active_element = null;
    }
    add_round_header(round, phase) {
        const header = document.createElement('h3');
        header.textContent = `Round ${round}: ${phase}`;
        header.classList.add('round-header', 'round-' + phase, 'round-' + round);
        this.transcript_container.append(header);
    }
    add_winner(winner) {
        const header = document.createElement('h3');
        const hr = document.createElement('hr');
        header.textContent = `Winner: ${winner}`;
        this.transcript_container.append(hr, header);
    }
    update_active_element(new_elem) {
        if (this.active_element) {
            this.active_element.classList.remove('active-element');
        }
        this.active_element = new_elem;
        new_elem.classList.add('active-element');
    }
    add_ablations() {
        const ablation_keys = Object.keys(demo.data['state']['ablations']);
        const non_ww_ablations = document.createElement('div');
        non_ww_ablations.textContent += 'Non-Werewolves: ';
        for (const ablation of ablation_keys) {
            const ab_element = document.createElement('span');
            const value = demo.data['state']['ablations'][ablation];
            ab_element.textContent = `${ablation}: ${value}, `;
            non_ww_ablations.appendChild(ab_element);
        }
        const ww_ablations = document.createElement('div');
        ww_ablations.textContent += 'Werewolves: ';
        if (demo.data['state']['werewolves'][0]['ablations'] != null) {
            const ww_ablation_keys = Object.keys(demo.data['state']['werewolves'][0]['ablations']);
            for (const ablation of ww_ablation_keys) {
                const ab_element = document.createElement('span');
                const value = demo.data['state']['werewolves'][0]['ablations'][ablation];
                ab_element.textContent = `${ablation}: ${value}, `;
                ww_ablations.appendChild(ab_element);
            }
        }
        else {
            ww_ablations.textContent += 'No Werewolf-specific ablations';
        }
        this.player_container.append(non_ww_ablations, ww_ablations);
    }
    add_bids(bids) {
        let bid_container = document.createElement('div');
        bid_container.classList.add('bidding');
        if (bids === undefined)
            return;
        const max_value = 4.0;
        const max_bar_height = 100.0;
        for (const bid of bids) {
            const player_container = document.createElement('div');
            const bid_int = parseFloat(bid[1]['result']['bid']);
            let barHeight = (bid_int / max_value) * max_bar_height;
            const bar = document.createElement('div');
            const bar_icon = document.createElement('img');
            bar_icon.src = `static/${bid[0]}.png`;
            bar_icon.classList.add('bid-icon');
            bar.append(bar_icon);
            bar.style.height = `${barHeight}px`;
            bar.classList.add('bid-bar');
            bar.classList.add(`bar-${bid_int}`);
            bar.classList.add(this.get_role_from_name(bid[0]) + '-short');
            const player_icon = document.createElement('img');
            player_icon.src = `static/${bid[0]}.png`;
            player_icon.classList.add('bid-icon');
            player_icon.onerror = () => {
                const colors = ['#dc3545', '#28a745', '#007bff', '#ffc107', '#6f42c1', '#fd7e14'];
                const colorIndex = bid[0].charCodeAt(0) % colors.length;
                player_icon.src = `data:image/svg+xml;base64,${btoa(`
          <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="10" fill="${colors[colorIndex]}"/>
            <text x="10" y="14" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8" font-weight="bold">${bid[0].charAt(0).toUpperCase()}</text>
          </svg>
        `)}`;
            };
            bar.textContent = `${bid[0]}: ${bid_int}`;
            bar.prepend(player_icon);
            player_container.append(bar);
            player_container.classList.add('bid_player-container');
            // const player_name = document.createElement('span');
            // player_name.textContent = bid[0];
            // player_name.classList.add(this.get_role_from_name(bid[0]));
            // player_name.classList.add(bid[0]);
            // const player_icon = document.createElement('img');
            // player_icon.src = `${bid[0]}.png`;
            // player_icon.classList.add('bid-icon');
            // const player_data = document.createElement('span');
            // let thinking = '';
            // if (bid[1]['result']['thinking']) {
            //   thinking = bid[1]['result']['thinking'];
            // } else {
            //   thinking = bid[1]['raw_resp'];
            // }
            // player_data.textContent = ` bid ${bid[1]['result']['bid']}`;
            const hidden_info = document.createElement('div');
            const raw_response = document.createElement('pre');
            const prompt = document.createElement('pre');
            hidden_info.append(prompt, raw_response);
            hidden_info.classList.add('needs_whitespace', 'hidden');
            raw_response.textContent = bid[1]['raw_resp'];
            prompt.textContent = bid[1]['prompt'];
            player_container.append(bar, hidden_info);
            player_container.addEventListener('click', (e) => {
                this.add_debug(hidden_info, player_container);
                // player_container.scrollIntoView({behavior: 'smooth'});
            });
            bid_container.appendChild(player_container);
        }
        const bid_note = document.createElement('div');
        bid_note.classList.add('bid-note');
        bid_note.textContent = 'Bids to speak next (0-4)';
        this.transcript_container.appendChild(bid_note);
        this.transcript_container.appendChild(bid_container);
    }
    add_roles(eliminate, investigate, protect) {
        let special_container = document.createElement('div');
        special_container.classList.add('special');
        const ww_container = this.create_special_container(eliminate, 'Werewolf', 'remove');
        special_container.append(ww_container);
        if (investigate != null) {
            const seer_container = this.create_special_container(investigate, 'Seer', 'investigate');
            special_container.append(seer_container);
        }
        if (protect != null) {
            const protect_container = this.create_special_container(protect, 'Doctor', 'protect');
            special_container.append(protect_container);
        }
        this.transcript_container.appendChild(special_container);
    }
    create_special_container(data, role, verb) {
        const container = document.createElement('div');
        container.classList.add(role);
        let thinking = '';
        if (data['result']['thinking']) {
            thinking = data['result']['thinking'];
        }
        else {
            thinking = data['raw_resp'];
        }
        container.textContent = `${role} decided to ${verb} ${data['result'][verb]}: "${thinking}"`;
        const hidden_info = document.createElement('div');
        const raw_response = document.createElement('pre');
        const prompt = document.createElement('pre');
        raw_response.textContent = data['raw_resp'];
        prompt.textContent = data['prompt'];
        hidden_info.append(prompt, raw_response);
        hidden_info.classList.add('needs_whitespace', 'hidden');
        container.append(hidden_info);
        container.addEventListener('click', (e) => {
            this.add_debug(hidden_info, container);
            // container.scrollIntoView({behavior: 'smooth'});
        });
        return container;
    }
    add_debate(debate) {
        if (debate == null)
            return;
        let debate_container = document.createElement('div');
        debate_container.classList.add('debate');
        let debate_name = document.createElement('p');
        let debate_thinking = document.createElement('p');
        let debate_icon = document.createElement('img');
        const name_and_image = document.createElement('div');
        name_and_image.classList.add('name-and-image');
        debate_thinking.classList.add('thinking');
        let debate_say = document.createElement('p');
        const hidden_info = document.createElement('div');
        const raw_response = document.createElement('pre');
        const prompt = document.createElement('pre');
        raw_response.textContent = debate[1]['raw_resp'];
        prompt.textContent = debate[1]['prompt'];
        hidden_info.append(debate_name, prompt, raw_response);
        hidden_info.classList.add('needs_whitespace', 'hidden');
        // debate_container.hidden_info = hidden_info;
        debate_name.textContent = debate[0];
        debate_icon.src = `static/${debate[0]}.png`;
        debate_icon.classList.add('debate-icon');
        debate_icon.onerror = () => {
            const colors = ['#dc3545', '#28a745', '#007bff', '#ffc107', '#6f42c1', '#fd7e14'];
            const colorIndex = debate[0].charCodeAt(0) % colors.length;
            debate_icon.src = `data:image/svg+xml;base64,${btoa(`
        <svg width="42" height="42" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg">
          <circle cx="21" cy="21" r="21" fill="${colors[colorIndex]}"/>
          <text x="21" y="28" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${debate[0].charAt(0).toUpperCase()}</text>
        </svg>
      `)}`;
        };
        debate_name.classList.add(this.get_role_from_name(debate[0]));
        name_and_image.append(debate_icon, debate_name);
        debate_thinking.textContent = debate[1]['result']['reasoning'];
        debate_say.textContent = debate[1]['result']['say'];
        debate_container.append(name_and_image, debate_thinking, debate_say, hidden_info);
        debate_container.addEventListener('click', (e) => {
            this.add_debug(hidden_info, debate_container);
            // debate_container.scrollIntoView({behavior: 'smooth'});
        });
        this.transcript_container.appendChild(debate_container);
    }
    add_summaries(summaries) {
        let summarize_container = document.createElement('div');
        summarize_container.classList.add('summarize');
        for (const summary of summaries) {
            if (summary != null) {
                const player_container = document.createElement('div');
                player_container.classList.add('summarize_player-container');
                const player_name = document.createElement('span');
                player_name.textContent = summary[0];
                player_name.classList.add(this.get_role_from_name(summary[0]));
                const player_icon = document.createElement('img');
                player_icon.src = `static/${summary[0]}.png`;
                player_icon.classList.add('summarize-icon');
                const player_data = document.createElement('span');
                player_data.textContent = ` is summarizing the round...`;
                const hidden_info = document.createElement('div');
                const raw_response = document.createElement('pre');
                const prompt = document.createElement('pre');
                hidden_info.append(prompt, raw_response);
                hidden_info.classList.add('needs_whitespace', 'hidden');
                raw_response.textContent = summary[1]['raw_resp'];
                prompt.textContent = summary[1]['prompt'];
                player_container.append(player_icon, player_name, player_data, hidden_info);
                player_container.addEventListener('click', (e) => {
                    this.add_debug(hidden_info, player_container);
                    // player_container.scrollIntoView({behavior: 'smooth'});
                });
                summarize_container.appendChild(player_container);
            }
        }
        if (summarize_container.childElementCount > 0) {
            this.transcript_container.appendChild(summarize_container);
            const divider = document.createElement('div');
            divider.classList.add('divider');
            divider.textContent = '🌑🌒🌓🌔🌕🌖🌗🌘';
            this.transcript_container.appendChild(divider);
        }
    }
    add_votes(votes_raw, players) {
        let vote_container = document.createElement('table');
        vote_container.classList.add('voting');
        // Only print the final votes
        let votes = votes_raw[votes_raw.length - 1];
        let name_row = document.createElement('tr');
        let vote_row = document.createElement('tr');
        let vote_cells = [];
        for (const player of players) {
            const player_container = document.createElement('th');
            const player_name = document.createElement('div');
            player_name.textContent = player;
            player_name.classList.add(this.get_role_from_name(player));
            const player_icon = document.createElement('img');
            player_icon.src = `static/${player}.png`;
            player_icon.classList.add('vote-icon');
            player_container.append(player_icon, player_name);
            name_row.append(player_container);
            const vote_cell = document.createElement('td');
            vote_row.append(vote_cell);
        }
        vote_container.append(name_row);
        vote_container.append(vote_row);
        for (const vote of votes) {
            for (let i = 0; i < players.length; i++) {
                const target = vote['log']['result']['vote'];
                console.log(vote);
                console.log(players[i]);
                if (target == players[i]) {
                    // console.log(vote_row.children)
                    // vote_row.children[i].innerHTML += vote.player;
                    const player_container = document.createElement('div');
                    player_container.classList.add('bid_player-container');
                    const player_icon = document.createElement('img');
                    player_icon.src = `static/${vote['player']}.png`;
                    player_icon.classList.add('vote-icon');
                    const player_name = document.createElement('span');
                    player_name.textContent = vote['player'];
                    player_name.classList.add(this.get_role_from_name(vote['player']));
                    // const player_icon = document.createElement('img')
                    const player_data = document.createElement('span');
                    const hidden_info = document.createElement('div');
                    const raw_response = document.createElement('pre');
                    const prompt = document.createElement('pre');
                    hidden_info.append(prompt, raw_response);
                    hidden_info.classList.add('needs_whitespace', 'hidden');
                    raw_response.textContent = vote['log']['raw_resp'];
                    prompt.textContent = vote['log']['prompt'];
                    player_container.append(player_icon, player_name, player_data, hidden_info);
                    player_container.addEventListener('click', (e) => {
                        this.add_debug(hidden_info, player_container);
                    });
                    vote_row.children[i].append(player_container);
                }
            }
        }
        // for (const vote of votes) {
        //   if (vote != null) {
        //     const player_container = document.createElement('div');
        //     player_container.classList.add('bid_player-container');
        //     const player_icon = document.createElement('img');
        //     player_icon.src = `static/${vote['player']}.png`;
        //     player_icon.classList.add('vote-icon');
        //     const player_name = document.createElement('span');
        //     player_name.textContent = vote['player'];
        //     player_name.classList.add(this.get_role_from_name(vote['player']));
        //     // const player_icon = document.createElement('img')
        //     const player_data = document.createElement('span');
        //     const target = vote['log']['result']['vote'];
        //     const target_elem = document.createElement('span');
        //     player_data.textContent = ` voted against `;
        //     target_elem.textContent = target;
        //     target_elem.classList.add(this.get_role_from_name(target) + '-short');
        //     player_data.append(target_elem);
        //     const hidden_info = document.createElement('div');
        //     const raw_response = document.createElement('pre');
        //     const prompt = document.createElement('pre');
        //     hidden_info.append(prompt, raw_response);
        //     hidden_info.classList.add('needs_whitespace', 'hidden');
        //     raw_response.textContent = vote['log']['raw_resp'];
        //     prompt.textContent = vote['log']['prompt'];
        //     player_container.append(
        //       player_icon,
        //       player_name,
        //       player_data,
        //       hidden_info,
        //     );
        //     // player_container.hidden_info = hidden_info;
        //     player_container.addEventListener('click', (e) => {
        //       this.add_debug(hidden_info, player_container);
        //       // player_container.scrollIntoView({behavior: 'smooth'});
        //     });
        //     vote_container.appendChild(player_container);
        //   }
        // }
        this.transcript_container.appendChild(vote_container);
    }
    add_exiled(exiled) {
        const new_elem = document.createElement('div');
        new_elem.classList.add('announcement');
        if (exiled == null) {
            new_elem.textContent = `There was no consensus, so no one was exiled.`;
        }
        else {
            new_elem.textContent = `${exiled} was exiled.`;
            const role = this.get_role_from_name(exiled);
            const exiled_icon = document.createElement('img');
            exiled_icon.src = `static/${exiled}.png`;
            exiled_icon.classList.add('exiled-icon');
            new_elem.prepend(exiled_icon);
            new_elem.classList.add('exiled', exiled, role, role + '-short');
        }
        this.transcript_container.appendChild(new_elem);
    }
    add_game_file(session_id) {
        const game_file = document.getElementById('game-file');
        if (game_file) {
            game_file.textContent = session_id;
        }
    }
    add_eliminated(eliminated) {
        const new_elem = document.createElement('div');
        new_elem.classList.add('announcement');
        if (eliminated == null) {
            new_elem.textContent = `No one was taken out during the night.`;
        }
        else {
            new_elem.textContent = `${eliminated} was taken out by the Werewolves.`;
            const role = this.get_role_from_name(eliminated);
            const eliminated_icon = document.createElement('img');
            eliminated_icon.src = `static/${eliminated}.png`;
            eliminated_icon.classList.add('exiled-icon');
            new_elem.prepend(eliminated_icon);
            new_elem.classList.add('eliminated', eliminated, role, role + '-short');
        }
        this.transcript_container.appendChild(new_elem);
    }
    add_debug(elem, highlight) {
        const new_elem = elem.cloneNode(true);
        new_elem.classList.remove('hidden');
        this.debug_container.textContent = '';
        this.debug_container.appendChild(new_elem);
        this.update_active_element(highlight);
    }
    add_player(player) {
        let player_container = document.createElement('div');
        player_container.classList.add('player-container-individual');
        let player_name = document.createElement('p');
        let player_model = document.createElement('p');
        let player_icon = document.createElement('img');
        player_name.classList.add(player.name, player.role);
        player_model.classList.add('player-model');
        player_icon.src = `static/${player.name}.png`;
        player_icon.classList.add('player-icon');
        player_name.textContent = player.name;
        player_model.textContent = `(${player.model})`;
        const hidden_info = document.createElement('div');
        hidden_info.classList.add('needs_whitespace', 'hidden');
        hidden_info.append(player_name.cloneNode(true), player_model.cloneNode(true));
        // player_container.hidden_info = hidden_info;
        player_container.append(player_icon, player_name, player_model, hidden_info);
        player_container.addEventListener('click', (e) => {
            this.add_debug(hidden_info, player_container);
        });
        this.player_container.appendChild(player_container);
    }
    get_role_from_name(name) {
        let ww_names = demo.data['state']['werewolves'].map((wolf) => {
            return wolf.name;
        });
        if (name == demo.data['state']['doctor'].name) {
            return 'Doctor';
        }
        else if (name == demo.data['state']['seer'].name) {
            return 'Seer';
        }
        else if (ww_names.includes(name)) {
            return 'Werewolf';
        }
        else {
            return 'Villager';
        }
    }
    reset() {
        // Clear containers to re-render from scratch on each poll
        this.player_container.textContent = '';
        this.transcript_container.textContent = '';
        this.debug_container.textContent = '';
        this.active_element = null;
    }
    renderPlayersOverview(players) {
        // Clear existing content
        this.player_container.textContent = '';
        const overview = document.createElement('div');
        overview.className = 'players-overview';
        const title = document.createElement('h3');
        title.textContent = 'Players Overview';
        title.style.marginBottom = '8px';
        overview.appendChild(title);
        const grid = document.createElement('div');
        grid.className = 'players-grid';
        // Sort players by role for better visual organization
        const playerNames = Object.keys(players);
        const sortedPlayers = playerNames.sort((a, b) => {
            const roleOrder = ['Werewolf', 'Seer', 'Doctor', 'Villager'];
            return roleOrder.indexOf(players[a].role) - roleOrder.indexOf(players[b].role);
        });
        for (const name of sortedPlayers) {
            const player = players[name];
            const card = document.createElement('div');
            card.className = 'player-card';
            const avatar = document.createElement('img');
            avatar.src = `static/${name}.png`;
            avatar.className = player.role.toLowerCase();
            const info = document.createElement('div');
            info.innerHTML = `
        <div style='font-weight:bold'>${name}</div>
        <div style='font-size:12px;color:#666'>${player.role}</div>
        <div style='font-size:11px;color:#999'>${player.model}</div>
      `;
            card.appendChild(avatar);
            card.appendChild(info);
            grid.appendChild(card);
        }
        overview.appendChild(grid);
        this.player_container.appendChild(overview);
    }
    renderTimelineView(events, players) {
        // Clear existing content
        this.transcript_container.textContent = '';
        const container = document.createElement('div');
        container.className = 'timeline-container';
        // Timeline header
        const header = document.createElement('div');
        header.className = 'timeline-header';
        header.innerHTML = '<h2>Game Timeline</h2>';
        container.appendChild(header);
        // Timeline
        const timeline = document.createElement('div');
        timeline.className = 'timeline';
        let currentRound = -1;
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            // Add round header if new round
            if (event.round !== currentRound) {
                currentRound = event.round;
                const roundHeader = document.createElement('div');
                roundHeader.className = 'round-header';
                const phaseIcon = event.phase === 'night' ? '🌙' : '☀️';
                roundHeader.textContent = `${phaseIcon} Round ${event.round} - ${event.phase === 'night' ? 'Night Phase' : 'Day Phase'}`;
                timeline.appendChild(roundHeader);
            }
            // Create timeline event
            const timelineEvent = document.createElement('div');
            timelineEvent.className = 'timeline-event';
            // Timeline content
            const content = document.createElement('div');
            content.className = 'timeline-content';
            // Player header
            const eventHeader = document.createElement('div');
            eventHeader.className = 'timeline-event-header';
            // Create player avatar with fallback
            const avatar = document.createElement('img');
            avatar.src = `static/${event.player}.png`;
            avatar.className = 'timeline-player-avatar';
            avatar.alt = event.player;
            const roleColor = this.getRoleColor(players[event.player].role);
            avatar.style.borderColor = roleColor;
            avatar.onerror = () => {
                // Use a simple colored circle as fallback
                const colors = ['#dc3545', '#28a745', '#007bff', '#ffc107', '#6f42c1', '#fd7e14'];
                const colorIndex = event.player.charCodeAt(0) % colors.length;
                avatar.src = `data:image/svg+xml;base64,${btoa(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="${colors[colorIndex]}"/>
            <text x="16" y="21" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">${event.player.charAt(0).toUpperCase()}</text>
          </svg>
        `)}`;
            };
            const playerInfo = document.createElement('div');
            playerInfo.className = 'timeline-player-info';
            playerInfo.innerHTML = `
        <div class="timeline-player-name" style="color:${roleColor}">${event.player}</div>
        <div class="timeline-player-role">${players[event.player].role}</div>
      `;
            eventHeader.appendChild(avatar);
            eventHeader.appendChild(playerInfo);
            content.appendChild(eventHeader);
            // Action type badge
            const actionType = document.createElement('div');
            actionType.className = 'timeline-action-type';
            actionType.classList.add(`timeline-${event.phase}`);
            actionType.textContent = this.getActionDisplayName(event.type);
            content.appendChild(actionType);
            // Reasoning
            if (event.result && event.result.reasoning) {
                const reasoning = document.createElement('div');
                reasoning.className = 'timeline-reasoning';
                reasoning.textContent = `💭 ${event.result.reasoning}`;
                content.appendChild(reasoning);
            }
            // Result/Action
            if (event.result && typeof event.result === 'object') {
                for (const key of ['say', 'vote', 'remove', 'investigate', 'protect', 'summary', 'bid']) {
                    if (event.result[key]) {
                        const result = document.createElement('div');
                        result.className = 'timeline-result';
                        const icon = this.getActionIcon(key);
                        result.innerHTML = `${icon} ${this.getActionDisplayName(key)}: ${event.result[key]}`;
                        content.appendChild(result);
                    }
                }
            }
            // Details (collapsible)
            if (event.prompt || event.raw_resp) {
                const details = document.createElement('details');
                details.className = 'timeline-details';
                const summary = document.createElement('summary');
                summary.textContent = '📋 View prompt & response details';
                details.appendChild(summary);
                if (event.prompt) {
                    const prompt = document.createElement('pre');
                    prompt.textContent = `Prompt:\n${event.prompt}`;
                    details.appendChild(prompt);
                }
                if (event.raw_resp) {
                    const response = document.createElement('pre');
                    response.textContent = `Response:\n${event.raw_resp}`;
                    details.appendChild(response);
                }
                content.appendChild(details);
            }
            // Timeline dot
            const dot = document.createElement('div');
            dot.className = 'timeline-dot';
            dot.classList.add(players[event.player].role.toLowerCase());
            timelineEvent.appendChild(content);
            timelineEvent.appendChild(dot);
            timeline.appendChild(timelineEvent);
        }
        container.appendChild(timeline);
        this.transcript_container.appendChild(container);
    }
    getRoleColor(role) {
        switch (role) {
            case 'Werewolf': return '#dc3545'; // Red
            case 'Seer': return '#28a745'; // Green
            case 'Doctor': return '#007bff'; // Blue
            case 'Villager': return '#6c757d'; // Gray
            default: return '#6c757d';
        }
    }
    getActionDisplayName(action) {
        const displayNames = {
            'eliminate': '🌙 Night Action: Eliminate',
            'protect': '🌙 Night Action: Protect',
            'investigate': '🌙 Night Action: Investigate',
            'bid': '💰 Bid to Speak',
            'debate': '🗣️ Debate',
            'summarize': '📝 Summarize',
            'vote': '🗳️ Vote',
            'say': '💬 Say',
            'remove': '❌ Remove',
            'summary': '📋 Summary'
        };
        return displayNames[action] || action;
    }
    getActionIcon(action) {
        const icons = {
            'say': '💬',
            'vote': '🗳️',
            'remove': '❌',
            'investigate': '🔍',
            'protect': '🛡️',
            'summary': '📋',
            'bid': '💰'
        };
        return icons[action] || '📝';
    }
}
let demo = new Demo();
let uiManager = new UIManager();
// Initial render
demo.retrieve_data();
// Poll every 1.5 seconds for live updates (优化刷新频率)
setInterval(() => {
    demo.retrieve_data();
}, 1500);
