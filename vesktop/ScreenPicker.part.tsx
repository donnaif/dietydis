// DietyDis: screens and windows in two titled groups, each source as a card with a fixed 16:9 preview
function ScreenPicker({ screens, chooseScreen }: { screens: Source[]; chooseScreen: (id: string) => void }) {
    const groups = [
        { title: "Screens", items: screens.filter(s => s.id.startsWith("screen")) },
        { title: "Windows", items: screens.filter(s => !s.id.startsWith("screen")) }
    ].filter(g => g.items.length);

    return (
        <div className={cl("groups")}>
            {groups.map(group => (
                <section key={group.title} className={cl("group")}>
                    <div className={cl("group-header")}>
                        <span className={cl("group-title")}>{group.title}</span>
                        <span className={cl("group-count")}>{group.items.length}</span>
                    </div>
                    <div className={cl("screen-grid")}>
                        {group.items.map(({ id, name, url }) => (
                            <label key={id} className={cl("screen-label")} title={name}>
                                <input
                                    type="radio"
                                    className={cl("screen-radio")}
                                    name="screen"
                                    value={id}
                                    onChange={() => chooseScreen(id)}
                                />
                                <div className={cl("screen-thumb")}>
                                    <img src={url} alt="" />
                                </div>
                                <div className={cl("screen-name")} dir="auto">
                                    {name}
                                </div>
                            </label>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

