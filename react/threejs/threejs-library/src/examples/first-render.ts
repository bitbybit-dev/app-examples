export const checkFirstRender = (firstRenderRef: { current: boolean }, c: () => void) => {
    if (firstRenderRef.current) {
        firstRenderRef.current = false;
        return;
    }
    c();
}
